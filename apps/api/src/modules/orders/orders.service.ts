import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto, OrderItemResponseDto } from './dto/order-response.dto';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { InventoryEventType, InventoryLog } from '../inventory/entities/inventory-log.entity';
import { Coupon, CouponType } from '../coupons/entities/coupon.entity';
import { Address } from '../shipping/entities/address.entity';
import { User } from '../users/user.entity';
import {
  OrderConfirmedEvent,
  OrderStatusUpdatedEvent,
} from '../notifications/events/notification.events';
import { OrdersGateway } from './orders.gateway';
import { CartService } from '../cart/cart.service';
import { RedisService } from '../../redis/redis.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus, ORDER_STATUS_TRANSITIONS } from '../../common/enums/order-status.enum';
import { Role } from '../../common/enums/role.enum';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedMeta } from '../../common/dto/base-response.dto';

const ORDER_NUMBER_MAX_ATTEMPTS = 3;

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly itemRepo: Repository<OrderItem>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly gateway: OrdersGateway,
    private readonly cartService: CartService,
    private readonly redis: RedisService,
  ) {}

  async create(
    dto: CreateOrderDto,
    requestingUser: { id: string; email: string; role: Role },
    idempotencyKey?: string,
  ): Promise<OrderResponseDto> {
    const idemRedisKey = idempotencyKey
      ? `idempotency:order:${requestingUser.id}:${idempotencyKey}`
      : null;

    if (idemRedisKey) {
      const existingOrderId = await this.redis.get<string>(idemRedisKey);
      if (existingOrderId) {
        return this.findOne(existingOrderId, requestingUser);
      }
    }

    for (let attempt = 0; attempt < ORDER_NUMBER_MAX_ATTEMPTS; attempt++) {
      const orderNumber = this.generateOrderNumber();
      try {
        const order = await this.runCreateTransaction(dto, requestingUser, orderNumber);

        const orderDto = this.toDto(order);

        if (idemRedisKey) {
          const ORDER_IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60;
          await this.redis.set(idemRedisKey, order.id, ORDER_IDEMPOTENCY_TTL_SECONDS);
        }

        this.emitOrderConfirmed(order, requestingUser.id);
        this.gateway.emitOrderCreated(requestingUser.id, orderDto);
        this.cartService
          .clearCart(requestingUser.id)
          .catch((err: Error) =>
            this.logger.error(`Failed to clear cart for user ${requestingUser.id}: ${err.message}`),
          );
        return orderDto;
      } catch (err) {
        if (this.isOrderNumberConflict(err) && attempt < ORDER_NUMBER_MAX_ATTEMPTS - 1) {
          continue;
        }
        throw err;
      }
    }

    throw new ServiceUnavailableException('Failed to generate a unique order number');
  }

  private async runCreateTransaction(
    dto: CreateOrderDto,
    requestingUser: { id: string; email: string; role: Role },
    orderNumber: string,
  ): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      let itemsSubtotal = 0;
      const orderItems: Partial<OrderItem>[] = [];

      // Lock inventory rows in a stable, variant-id order to avoid lock-ordering
      // deadlocks between concurrent multi-item orders.
      const sortedItems = [...dto.items].sort((a, b) =>
        a.variantId.localeCompare(b.variantId),
      );

      for (const item of sortedItems) {
        // Fetch variant + product from DB — server side, never trust client price
        const variant = await manager.findOne(ProductVariant, {
          where: { id: item.variantId, isActive: true },
          relations: ['product'],
        });

        if (!variant) {
          throw new NotFoundException(`Variant ${item.variantId} not found or inactive`);
        }
        if (variant.product.deletedAt !== null) {
          throw new UnprocessableEntityException(
            `Product for variant ${item.variantId} is no longer available`,
          );
        }

        // Reserve stock (row-level locked)
        const inv = await manager
          .createQueryBuilder(InventoryItem, 'inv')
          .setLock('pessimistic_write')
          .where('inv.variant_id = :variantId', { variantId: item.variantId })
          .getOne();

        if (!inv) {
          throw new UnprocessableEntityException(
            `No inventory record for variant ${item.variantId}`,
          );
        }
        if (inv.quantity - inv.reservedQuantity < item.quantity) {
          throw new UnprocessableEntityException(
            `Insufficient stock for variant ${item.variantId} (available: ${inv.quantity - inv.reservedQuantity})`,
          );
        }

        inv.reservedQuantity += item.quantity;
        await manager.save(InventoryItem, inv);

        await manager.save(
          InventoryLog,
          manager.create(InventoryLog, {
            inventoryItemId: inv.id,
            eventType: InventoryEventType.ORDER_RESERVE,
            adjustment: item.quantity,
            quantityBefore: inv.quantity,
            quantityAfter: inv.quantity,
            reason: `Order ${orderNumber} created — ${item.quantity} units reserved`,
            performedById: requestingUser.id,
            performedByEmail: requestingUser.email,
          }),
        );

        const unitPrice = +(variant.salePrice ?? variant.price);
        const totalPrice = +(unitPrice * item.quantity).toFixed(2);
        itemsSubtotal += totalPrice;

        orderItems.push({
          productId: variant.productId,
          variantId: variant.id,
          productName: variant.product.name,
          quantity: item.quantity,
          unitPrice,
          totalPrice,
        });
      }

      // Coupon validation — server-side, locked to prevent race conditions
      let discountAmount = 0;
      let couponId: string | null = null;

      if (dto.couponCode) {
        const coupon = await manager
          .createQueryBuilder(Coupon, 'c')
          .setLock('pessimistic_write')
          .where('c.code = :code AND c.is_active = true AND c.deleted_at IS NULL', {
            code: dto.couponCode,
          })
          .getOne();

        if (!coupon) {
          throw new NotFoundException(`Coupon "${dto.couponCode}" not found or inactive`);
        }

        const now = new Date();
        if (coupon.startsAt && now < coupon.startsAt) {
          throw new UnprocessableEntityException('Coupon is not yet active');
        }
        if (coupon.expiresAt && now > coupon.expiresAt) {
          throw new UnprocessableEntityException('Coupon has expired');
        }
        if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
          throw new UnprocessableEntityException('Coupon usage limit reached');
        }
        if (coupon.minOrderAmount !== null && itemsSubtotal < +coupon.minOrderAmount) {
          throw new UnprocessableEntityException(
            `Minimum order amount is $${coupon.minOrderAmount}`,
          );
        }

        if (coupon.type === CouponType.PERCENT) {
          discountAmount = +(itemsSubtotal * (+coupon.value / 100)).toFixed(2);
        } else {
          discountAmount = +Math.min(+coupon.value, itemsSubtotal).toFixed(2);
        }

        // Atomically increment usedCount inside the same transaction
        coupon.usedCount += 1;
        await manager.save(Coupon, coupon);
        couponId = coupon.id;
      }

      // Shipping address — must belong to the requesting user
      if (dto.shippingAddressId) {
        const address = await manager.findOne(Address, {
          where: { id: dto.shippingAddressId },
        });
        if (!address || address.userId !== requestingUser.id) {
          throw new NotFoundException(`Address ${dto.shippingAddressId} not found`);
        }
      }

      // Shipping rate is server-controlled via SHIPPING_FLAT_RATE env var (default 0).
      // Replace this line with ShippingRateService.calculateRate() when carrier
      // integration is ready.
      const shippingAmount = this.config.get<number>('app.shippingFlatRate') ?? 0;
      const totalAmount = itemsSubtotal - discountAmount + shippingAmount;

      const newOrder = manager.create(Order, {
        orderNumber,
        userId: requestingUser.id,
        couponId,
        shippingAddressId: dto.shippingAddressId ?? null,
        discountAmount,
        shippingAmount,
        totalAmount: Math.max(0, totalAmount),
        notes: dto.notes ?? null,
      });
      const saved = await manager.save(Order, newOrder);

      const savedItems = await manager.save(
        OrderItem,
        orderItems.map((i) => manager.create(OrderItem, { ...i, orderId: saved.id })),
      );
      saved.items = savedItems;
      return saved;
    });
  }

  private emitOrderConfirmed(order: Order, userId: string): void {
    this.userRepo
      .findOne({ where: { id: userId } })
      .then((user) => {
        if (!user) return;
        this.eventEmitter.emit(
          'order.confirmed',
          new OrderConfirmedEvent(
            order.id,
            userId,
            user.email,
            user.firstName,
            order.orderNumber,
            (order.items ?? []).map((i) => ({
              name: i.productName,
              quantity: i.quantity,
              price: +i.unitPrice,
            })),
            +order.totalAmount + +order.discountAmount - +order.shippingAmount,
            +order.totalAmount,
            order.notes ?? 'See order details',
          ),
        );
      })
      .catch((err: Error) =>
        this.logger.error(`Failed to emit order.confirmed for ${order.id}: ${err.message}`),
      );
  }

  private isOrderNumberConflict(err: unknown): boolean {
    return (
      err instanceof QueryFailedError &&
      (err as unknown as { code: string; constraint?: string }).code === '23505' &&
      (err as unknown as { code: string; constraint?: string }).constraint ===
        'UQ_orders_order_number'
    );
  }

  async findOne(
    id: string,
    requestingUser: { id: string; role: Role },
  ): Promise<OrderResponseDto> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!order) throw new NotFoundException(`Order ${id} not found`);

    // Customers may only see their own orders
    if (
      requestingUser.role === Role.CUSTOMER &&
      order.userId !== requestingUser.id
    ) {
      throw new ForbiddenException('Access denied');
    }

    return this.toDto(order);
  }

  async updateStatus(
    id: string,
    dto: UpdateOrderStatusDto,
  ): Promise<OrderResponseDto> {
    const order = await this.dataSource.transaction(async (manager) => {
      const found = await manager.findOne(Order, { where: { id }, relations: ['items'] });
      if (!found) throw new NotFoundException(`Order ${id} not found`);

      const allowed = ORDER_STATUS_TRANSITIONS[found.status];
      if (!allowed.includes(dto.status)) {
        throw new UnprocessableEntityException(
          `Cannot transition order from "${found.status}" to "${dto.status}"`,
        );
      }

      // Inventory side-effects: release reservation on cancel, commit sale on deliver.
      // Batch-load all inventory rows in a single FOR UPDATE to avoid N+1 and minimize lock hold time.
      if (dto.status === OrderStatus.CANCELLED || dto.status === OrderStatus.DELIVERED) {
        const variantIds = found.items.map((i) => i.variantId);

        const inventories = await manager
          .createQueryBuilder(InventoryItem, 'inv')
          .setLock('pessimistic_write')
          .where('inv.variant_id IN (:...variantIds)', { variantIds })
          .getMany();

        const invMap = new Map(inventories.map((inv) => [inv.variantId, inv]));

        for (const item of found.items) {
          const inv = invMap.get(item.variantId);
          if (!inv) continue;

          const quantityBefore = inv.quantity;

          if (dto.status === OrderStatus.CANCELLED) {
            // Release reservation only — physical stock stays in warehouse
            inv.reservedQuantity = Math.max(0, inv.reservedQuantity - item.quantity);
            await manager.save(InventoryItem, inv);

            await manager.save(
              InventoryLog,
              manager.create(InventoryLog, {
                inventoryItemId: inv.id,
                eventType: InventoryEventType.ORDER_RELEASE,
                adjustment: -item.quantity,
                quantityBefore,
                quantityAfter: inv.quantity,
                reason: `Order ${found.orderNumber} cancelled — reservation released`,
                performedById: null,
              }),
            );
          } else {
            // DELIVERED: deduct physical stock, release reservation, increment soldCount
            inv.quantity = Math.max(0, inv.quantity - item.quantity);
            inv.reservedQuantity = Math.max(0, inv.reservedQuantity - item.quantity);
            inv.soldCount += item.quantity;
            await manager.save(InventoryItem, inv);

            await manager.save(
              InventoryLog,
              manager.create(InventoryLog, {
                inventoryItemId: inv.id,
                eventType: InventoryEventType.ORDER_COMMIT,
                adjustment: -item.quantity,
                quantityBefore,
                quantityAfter: inv.quantity,
                reason: `Order ${found.orderNumber} delivered — stock committed`,
                performedById: null,
              }),
            );
          }
        }
      }

      found.status = dto.status;
      await manager.save(Order, found);
      return found;
    });

    const updatedDto = this.toDto(order);

    // Push real-time event before async notifications
    this.gateway.emitOrderStatusUpdated(order.userId, updatedDto);

    const user = await this.userRepo.findOne({ where: { id: order.userId } });
    if (user) {
      const messages: Record<OrderStatus, string> = {
        [OrderStatus.NEW]: 'Your order has been received.',
        [OrderStatus.CONFIRMED]: 'Your order has been confirmed and is being prepared.',
        [OrderStatus.SHIPPING]: 'Your order is on its way!',
        [OrderStatus.DELIVERED]: 'Your order has been delivered. Enjoy!',
        [OrderStatus.CANCELLED]: 'Your order has been cancelled.',
      };
      this.eventEmitter.emit(
        'order.status_updated',
        new OrderStatusUpdatedEvent(
          order.id,
          order.userId,
          user.email,
          user.firstName,
          order.orderNumber,
          dto.status,
          messages[dto.status],
        ),
      );
    }

    return updatedDto;
  }

  async findAll(
    pagination: PaginationDto,
  ): Promise<{ data: OrderResponseDto[]; meta: PaginatedMeta }> {
    const { page, limit } = pagination;
    const [orders, total] = await this.orderRepo.findAndCount({
      relations: ['items'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: orders.map((o) => this.toDto(o)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findByUser(
    userId: string,
    pagination: PaginationDto,
  ): Promise<{ data: OrderResponseDto[]; meta: PaginatedMeta }> {
    const { page, limit } = pagination;
    const [orders, total] = await this.orderRepo.findAndCount({
      where: { userId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: orders.map((o) => this.toDto(o)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  private generateOrderNumber(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const suffix = randomBytes(4).toString('hex').toUpperCase(); // 4 bytes → 8 hex chars
    return `ORD-${date}-${suffix}`; // 21 chars total, fits VARCHAR(30)
  }

  private toDto(order: Order): OrderResponseDto {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      couponId: order.couponId,
      shippingAddressId: order.shippingAddressId,
      status: order.status,
      totalAmount: +order.totalAmount,
      discountAmount: +order.discountAmount,
      shippingAmount: +order.shippingAmount,
      notes: order.notes,
      items: (order.items ?? []).map(
        (i): OrderItemResponseDto => ({
          id: i.id,
          productId: i.productId,
          variantId: i.variantId,
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: +i.unitPrice,
          totalPrice: +i.totalPrice,
        }),
      ),
      createdAt: order.createdAt?.toISOString(),
    };
  }
}
