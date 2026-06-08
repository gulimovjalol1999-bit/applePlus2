import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto, OrderItemResponseDto } from './dto/order-response.dto';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { User } from '../users/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus, ORDER_STATUS_TRANSITIONS } from '../../common/enums/order-status.enum';
import { Role } from '../../common/enums/role.enum';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedMeta } from '../../common/dto/base-response.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly itemRepo: Repository<OrderItem>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly notifications: NotificationsService,
  ) {}

  async create(
    dto: CreateOrderDto,
    requestingUser: { id: string; role: Role },
  ): Promise<OrderResponseDto> {
    const order = await this.dataSource.transaction(async (manager) => {
      let itemsSubtotal = 0;
      const orderItems: Partial<OrderItem>[] = [];

      for (const item of dto.items) {
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

      const totalAmount =
        itemsSubtotal - (dto.discountAmount ?? 0) + (dto.shippingAmount ?? 0);

      const newOrder = manager.create(Order, {
        orderNumber: this.generateOrderNumber(),
        userId: requestingUser.id,
        discountAmount: dto.discountAmount ?? 0,
        shippingAmount: dto.shippingAmount ?? 0,
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

    // Send confirmation email + telegram — fire-and-forget, don't block the response
    void this.sendOrderConfirmationNotification(order, requestingUser.id);

    return this.toDto(order);
  }

  private async sendOrderConfirmationNotification(
    order: Order,
    userId: string,
  ): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return;

    await this.notifications.sendOrderConfirmation({
      to: user.email,
      firstName: user.firstName,
      orderNumber: order.orderNumber,
      items: (order.items ?? []).map((i) => ({
        name: i.productName,
        quantity: i.quantity,
        price: +i.unitPrice,
      })),
      subtotal: +order.totalAmount + +order.discountAmount - +order.shippingAmount,
      total: +order.totalAmount,
      shippingAddress: order.notes ?? 'See order details',
    });
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
    const order = await this.orderRepo.findOne({ where: { id }, relations: ['items'] });
    if (!order) throw new NotFoundException(`Order ${id} not found`);

    const allowed = ORDER_STATUS_TRANSITIONS[order.status];
    if (!allowed.includes(dto.status)) {
      throw new UnprocessableEntityException(
        `Cannot transition order from "${order.status}" to "${dto.status}"`,
      );
    }

    order.status = dto.status;
    await this.orderRepo.save(order);

    const user = await this.userRepo.findOne({ where: { id: order.userId ?? '' } });
    if (user) {
      const messages: Record<OrderStatus, string> = {
        [OrderStatus.NEW]: 'Your order has been received.',
        [OrderStatus.CONFIRMED]: 'Your order has been confirmed and is being prepared.',
        [OrderStatus.SHIPPING]: 'Your order is on its way!',
        [OrderStatus.DELIVERED]: 'Your order has been delivered. Enjoy!',
        [OrderStatus.CANCELLED]: 'Your order has been cancelled.',
      };
      void this.notifications.sendOrderStatusUpdate({
        to: user.email,
        firstName: user.firstName,
        orderNumber: order.orderNumber,
        status: dto.status,
        statusMessage: messages[dto.status],
      });
    }

    return this.toDto(order);
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
    const suffix = randomBytes(3).toString('hex').toUpperCase();
    return `ORD-${date}-${suffix}`;
  }

  private toDto(order: Order): OrderResponseDto {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
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
