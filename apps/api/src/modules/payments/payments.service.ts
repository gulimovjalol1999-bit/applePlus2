import {
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { WebhookPaymentDto } from './dto/webhook-payment.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import {
  PaymentStatus,
  PAYMENT_STATUS_TRANSITIONS,
} from '../../common/enums/payment-status.enum';
import { OrderStatus } from '../../common/enums/order-status.enum';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly repo: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreatePaymentDto): Promise<PaymentResponseDto> {
    // Idempotency check — return existing record without creating a duplicate
    const existing = await this.repo.findOne({
      where: { idempotencyKey: dto.idempotencyKey },
    });
    if (existing) {
      // A FAILED payment can be retried by reusing the same idempotency key:
      // reset the existing row instead of returning the stale failure
      // (idempotencyKey is unique, so a new row can't be inserted).
      if (existing.status === PaymentStatus.FAILED) {
        return this.dataSource.transaction(async (manager) => {
          const order = await manager
            .createQueryBuilder(Order, 'o')
            .setLock('pessimistic_read')
            .where('o.id = :id', { id: existing.orderId })
            .getOne();

          if (!order) throw new NotFoundException(`Order ${existing.orderId} not found`);
          if (order.status === OrderStatus.CANCELLED) {
            throw new UnprocessableEntityException('Cannot create payment for a cancelled order');
          }

          existing.status = PaymentStatus.PENDING;
          existing.amount = +order.totalAmount;
          existing.provider = dto.provider;
          existing.currency = dto.currency ?? 'USD';
          existing.providerPaymentId = null;
          existing.paidAt = null;
          existing.metadata = {};

          const saved = await manager.save(Payment, existing);
          this.logger.log(
            `Payment retry: id=${saved.id} order=${saved.orderId} key=${dto.idempotencyKey} reset to PENDING`,
          );
          return this.toDto(saved);
        });
      }

      this.logger.log(`Idempotent return for key=${dto.idempotencyKey} payment=${existing.id}`);
      return this.toDto(existing);
    }

    return this.dataSource.transaction(async (manager) => {
      // Lock order row to prevent concurrent payment creation on same order
      const order = await manager
        .createQueryBuilder(Order, 'o')
        .setLock('pessimistic_read')
        .where('o.id = :id', { id: dto.orderId })
        .getOne();

      if (!order) throw new NotFoundException(`Order ${dto.orderId} not found`);

      if (order.status === OrderStatus.CANCELLED) {
        throw new UnprocessableEntityException('Cannot create payment for a cancelled order');
      }

      // Server-side amount — never trust client-supplied amount
      const amount = +order.totalAmount;

      const payment = manager.create(Payment, {
        orderId: dto.orderId,
        provider: dto.provider,
        amount,
        currency: dto.currency ?? 'USD',
        status: PaymentStatus.PENDING,
        idempotencyKey: dto.idempotencyKey,
        metadata: {},
      });

      const saved = await manager.save(Payment, payment);
      this.logger.log(
        `Payment created: id=${saved.id} order=${dto.orderId} amount=${amount} ${payment.currency} provider=${dto.provider}`,
      );
      return this.toDto(saved);
    });
  }

  async updateStatus(id: string, dto: UpdatePaymentDto): Promise<PaymentResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      // Pessimistic lock prevents concurrent status updates on same payment
      const payment = await manager
        .createQueryBuilder(Payment, 'p')
        .setLock('pessimistic_write')
        .where('p.id = :id', { id })
        .getOne();

      if (!payment) throw new NotFoundException(`Payment ${id} not found`);

      const allowed = PAYMENT_STATUS_TRANSITIONS[payment.status];
      if (!allowed.includes(dto.status)) {
        throw new UnprocessableEntityException(
          `Cannot transition payment from "${payment.status}" to "${dto.status}"`,
        );
      }

      const prevStatus = payment.status;
      payment.status = dto.status;
      if (dto.providerPaymentId !== undefined) payment.providerPaymentId = dto.providerPaymentId;
      if (dto.metadata !== undefined) payment.metadata = dto.metadata;

      // paidAt is server-controlled — set once when transitioning to PAID
      if (dto.status === PaymentStatus.PAID && !payment.paidAt) {
        payment.paidAt = new Date();
      }

      await manager.save(Payment, payment);
      this.logger.log(`Payment ${id} transitioned: ${prevStatus} → ${dto.status}`);

      // Auto-confirm order when payment succeeds (only if still NEW to avoid overwriting progress)
      if (dto.status === PaymentStatus.PAID) {
        const result = await manager
          .createQueryBuilder()
          .update(Order)
          .set({ status: OrderStatus.CONFIRMED })
          .where('id = :orderId AND status = :current', {
            orderId: payment.orderId,
            current: OrderStatus.NEW,
          })
          .execute();

        if ((result.affected ?? 0) > 0) {
          this.logger.log(`Order ${payment.orderId} auto-confirmed after payment success`);
        }
      }

      return this.toDto(payment);
    });
  }

  async processWebhook(dto: WebhookPaymentDto): Promise<void> {
    const payment = await this.repo.findOne({ where: { id: dto.internalId } });
    if (!payment) {
      // Return without error so provider stops retrying for unknown IDs
      this.logger.warn(`Webhook received for unknown payment id=${dto.internalId}`);
      return;
    }

    const allowed = PAYMENT_STATUS_TRANSITIONS[payment.status];
    if (!allowed.includes(dto.status)) {
      this.logger.warn(
        `Webhook invalid transition ${payment.status} → ${dto.status} for payment ${dto.internalId}`,
      );
      return;
    }

    await this.updateStatus(dto.internalId, {
      status: dto.status,
      providerPaymentId: dto.providerPaymentId,
      metadata: dto.metadata,
    });

    this.logger.log(`Webhook processed: payment=${dto.internalId} → ${dto.status}`);
  }

  async findByOrder(orderId: string): Promise<PaymentResponseDto[]> {
    const payments = await this.repo.find({
      where: { orderId },
      order: { createdAt: 'DESC' },
    });
    return payments.map((p) => this.toDto(p));
  }

  async findOne(id: string): Promise<PaymentResponseDto> {
    const payment = await this.repo.findOne({ where: { id } });
    if (!payment) throw new NotFoundException(`Payment ${id} not found`);
    return this.toDto(payment);
  }

  private toDto(payment: Payment): PaymentResponseDto {
    return {
      id: payment.id,
      orderId: payment.orderId,
      status: payment.status,
      provider: payment.provider,
      providerPaymentId: payment.providerPaymentId,
      amount: +payment.amount,
      currency: payment.currency,
      metadata: payment.metadata,
      paidAt: payment.paidAt?.toISOString() ?? null,
      createdAt: payment.createdAt?.toISOString(),
      updatedAt: payment.updatedAt?.toISOString(),
    };
  }
}
