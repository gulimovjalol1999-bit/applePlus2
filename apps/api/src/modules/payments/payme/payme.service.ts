import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Between, DataSource, EntityManager, Repository } from 'typeorm';
import { PaymeTransaction } from '../entities/payme-transaction.entity';
import { Payment } from '../entities/payment.entity';
import { Order } from '../../orders/entities/order.entity';
import { InventoryItem } from '../../inventory/entities/inventory-item.entity';
import {
  InventoryEventType,
  InventoryLog,
} from '../../inventory/entities/inventory-log.entity';
import { PaymeState } from '../../../common/enums/payme.enum';
import { PaymentStatus } from '../../../common/enums/payment-status.enum';
import { OrderStatus } from '../../../common/enums/order-status.enum';
import { PaymeError } from './payme-error';
import { PaymeParams } from './payme.types';

@Injectable()
export class PaymeService {
  private readonly logger = new Logger(PaymeService.name);

  constructor(
    @InjectRepository(PaymeTransaction)
    private readonly txRepo: Repository<PaymeTransaction>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  // ──────────────────────────────────────────────────────────────────────────
  // Outbound: build the hosted-checkout redirect URL for a customer
  // ──────────────────────────────────────────────────────────────────────────

  async buildCheckoutUrl(orderId: string, userId: string): Promise<string | null> {
    const merchantId = this.config.get<string>('payme.merchantId');
    // Payme not configured yet → signal the caller to skip the redirect and let
    // the order complete without online payment.
    if (!merchantId) return null;

    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order || order.userId !== userId) {
      throw PaymeError.orderNotFound();
    }
    if (order.status !== OrderStatus.NEW) {
      throw PaymeError.orderNotPayable();
    }

    const accountField = this.config.get<string>('payme.accountField');
    const baseUrl = this.config.get<string>('payme.checkoutBaseUrl');
    const returnUrl = this.config.get<string>('payme.returnUrl');

    const parts = [
      `m=${merchantId}`,
      `ac.${accountField}=${order.id}`,
      `a=${this.toTiyin(order.totalAmount)}`,
    ];
    if (returnUrl) parts.push(`c=${returnUrl}/orders/${order.id}`);

    const encoded = Buffer.from(parts.join(';')).toString('base64');
    return `${baseUrl}/${encoded}`;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Inbound: Merchant API JSON-RPC methods (Payme calls these)
  // ──────────────────────────────────────────────────────────────────────────

  async checkPerformTransaction(params: PaymeParams): Promise<{ allow: true }> {
    const order = await this.resolveOrder(params);
    this.assertAmount(order, params.amount);
    return { allow: true };
  }

  async createTransaction(params: PaymeParams): Promise<{
    create_time: number;
    transaction: string;
    state: PaymeState;
  }> {
    const paymeId = params.id as string;

    const existing = await this.txRepo.findOne({ where: { paymeId } });
    if (existing) {
      if (existing.state !== PaymeState.CREATED) throw PaymeError.cannotPerform();
      return {
        create_time: Number(existing.paymeCreateTime),
        transaction: existing.id,
        state: existing.state,
      };
    }

    const order = await this.resolveOrder(params);
    this.assertAmount(order, params.amount);

    // Reject if another active (pending) Payme transaction already holds this order.
    const active = await this.txRepo.findOne({
      where: { orderId: order.id, state: PaymeState.CREATED },
    });
    if (active) throw PaymeError.orderNotPayable();

    const created = await this.txRepo.save(
      this.txRepo.create({
        paymeId,
        orderId: order.id,
        amount: String(params.amount),
        state: PaymeState.CREATED,
        paymeCreateTime: String(params.time ?? Date.now()),
      }),
    );

    this.logger.log(`Payme CreateTransaction: payme=${paymeId} order=${order.id}`);
    return {
      create_time: Number(created.paymeCreateTime),
      transaction: created.id,
      state: created.state,
    };
  }

  async performTransaction(params: PaymeParams): Promise<{
    transaction: string;
    perform_time: number;
    state: PaymeState;
  }> {
    return this.dataSource.transaction(async (manager) => {
      const tx = await this.lockTx(manager, params.id as string);

      if (tx.state === PaymeState.PERFORMED) {
        return {
          transaction: tx.id,
          perform_time: Number(tx.performTime),
          state: tx.state,
        };
      }
      if (tx.state !== PaymeState.CREATED) throw PaymeError.cannotPerform();

      const performTime = Date.now();
      tx.state = PaymeState.PERFORMED;
      tx.performTime = String(performTime);
      await manager.save(PaymeTransaction, tx);

      await this.confirmOrderAndLedger(manager, tx);

      this.logger.log(`Payme PerformTransaction: payme=${tx.paymeId} order=${tx.orderId}`);
      return { transaction: tx.id, perform_time: performTime, state: tx.state };
    });
  }

  async cancelTransaction(params: PaymeParams): Promise<{
    transaction: string;
    cancel_time: number;
    state: PaymeState;
  }> {
    return this.dataSource.transaction(async (manager) => {
      const tx = await this.lockTx(manager, params.id as string);

      // Idempotent: already cancelled
      if (
        tx.state === PaymeState.CANCELLED ||
        tx.state === PaymeState.CANCELLED_AFTER_PERFORM
      ) {
        return {
          transaction: tx.id,
          cancel_time: Number(tx.cancelTime),
          state: tx.state,
        };
      }

      const cancelTime = Date.now();
      tx.cancelTime = String(cancelTime);
      tx.reason = params.reason ?? null;

      if (tx.state === PaymeState.CREATED) {
        // Pending payment voided — leave the order NEW so the customer can retry.
        tx.state = PaymeState.CANCELLED;
      } else {
        // Refund after a successful payment — void the order if not yet delivered.
        await this.refundOrder(manager, tx);
        tx.state = PaymeState.CANCELLED_AFTER_PERFORM;
      }

      await manager.save(PaymeTransaction, tx);
      this.logger.log(
        `Payme CancelTransaction: payme=${tx.paymeId} order=${tx.orderId} state=${tx.state}`,
      );
      return { transaction: tx.id, cancel_time: cancelTime, state: tx.state };
    });
  }

  async checkTransaction(params: PaymeParams): Promise<{
    create_time: number;
    perform_time: number;
    cancel_time: number;
    transaction: string;
    state: PaymeState;
    reason: number | null;
  }> {
    const tx = await this.txRepo.findOne({ where: { paymeId: params.id as string } });
    if (!tx) throw PaymeError.transactionNotFound();
    return {
      create_time: Number(tx.paymeCreateTime),
      perform_time: Number(tx.performTime),
      cancel_time: Number(tx.cancelTime),
      transaction: tx.id,
      state: tx.state,
      reason: tx.reason,
    };
  }

  async getStatement(params: PaymeParams): Promise<{ transactions: unknown[] }> {
    const accountField = this.config.get<string>('payme.accountField') as string;
    const txs = await this.txRepo.find({
      where: { paymeCreateTime: Between(String(params.from), String(params.to)) },
      order: { paymeCreateTime: 'ASC' },
    });

    return {
      transactions: txs.map((tx) => ({
        id: tx.paymeId,
        time: Number(tx.paymeCreateTime),
        amount: Number(tx.amount),
        account: { [accountField]: tx.orderId },
        create_time: Number(tx.paymeCreateTime),
        perform_time: Number(tx.performTime),
        cancel_time: Number(tx.cancelTime),
        transaction: tx.id,
        state: tx.state,
        reason: tx.reason,
      })),
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────────────────────────────

  private toTiyin(amount: number | string): number {
    return Math.round(Number(amount) * 100);
  }

  private async resolveOrder(params: PaymeParams): Promise<Order> {
    const accountField = this.config.get<string>('payme.accountField') as string;
    const orderId = params.account?.[accountField];
    if (!orderId) throw PaymeError.orderNotFound();

    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw PaymeError.orderNotFound();
    if (order.status !== OrderStatus.NEW) throw PaymeError.orderNotPayable();
    return order;
  }

  private assertAmount(order: Order, amount: number | undefined): void {
    if (this.toTiyin(order.totalAmount) !== Number(amount)) {
      throw PaymeError.invalidAmount();
    }
  }

  private async lockTx(
    manager: EntityManager,
    paymeId: string,
  ): Promise<PaymeTransaction> {
    const tx = await manager
      .createQueryBuilder(PaymeTransaction, 't')
      .setLock('pessimistic_write')
      .where('t.payme_id = :paymeId', { paymeId })
      .getOne();
    if (!tx) throw PaymeError.transactionNotFound();
    return tx;
  }

  /** Mark the order CONFIRMED (if still NEW) and write a PAID ledger entry. */
  private async confirmOrderAndLedger(
    manager: EntityManager,
    tx: PaymeTransaction,
  ): Promise<void> {
    const order = await manager.findOne(Order, { where: { id: tx.orderId } });
    if (!order) return;

    await manager
      .createQueryBuilder()
      .update(Order)
      .set({ status: OrderStatus.CONFIRMED })
      .where('id = :orderId AND status = :current', {
        orderId: tx.orderId,
        current: OrderStatus.NEW,
      })
      .execute();

    await manager.save(
      Payment,
      manager.create(Payment, {
        orderId: tx.orderId,
        provider: 'payme',
        providerPaymentId: tx.paymeId,
        amount: +order.totalAmount,
        currency: 'UZS',
        status: PaymentStatus.PAID,
        paidAt: new Date(),
        idempotencyKey: `payme:${tx.paymeId}`,
        metadata: { paymeTransactionId: tx.id },
      }),
    );
  }

  /**
   * Refund a performed transaction: cancel the order (unless already delivered)
   * release its inventory reservations and mark the ledger entry REFUNDED.
   * Mirrors the cancel branch of OrdersService.updateStatus.
   */
  private async refundOrder(
    manager: EntityManager,
    tx: PaymeTransaction,
  ): Promise<void> {
    const order = await manager.findOne(Order, {
      where: { id: tx.orderId },
      relations: ['items'],
    });
    if (!order) return;
    if (order.status === OrderStatus.DELIVERED) throw PaymeError.cannotCancel();

    if (order.status !== OrderStatus.CANCELLED) {
      const variantIds = order.items.map((i) => i.variantId);
      if (variantIds.length > 0) {
        const inventories = await manager
          .createQueryBuilder(InventoryItem, 'inv')
          .setLock('pessimistic_write')
          .where('inv.variant_id IN (:...variantIds)', { variantIds })
          .getMany();
        const invMap = new Map(inventories.map((inv) => [inv.variantId, inv]));

        for (const item of order.items) {
          const inv = invMap.get(item.variantId);
          if (!inv) continue;
          const quantityBefore = inv.quantity;
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
              reason: `Order ${order.orderNumber} refunded via Payme — reservation released`,
              performedById: null,
            }),
          );
        }
      }

      order.status = OrderStatus.CANCELLED;
      await manager.save(Order, order);
    }

    await manager
      .createQueryBuilder()
      .update(Payment)
      .set({ status: PaymentStatus.REFUNDED })
      .where('idempotency_key = :key', { key: `payme:${tx.paymeId}` })
      .execute();
  }
}
