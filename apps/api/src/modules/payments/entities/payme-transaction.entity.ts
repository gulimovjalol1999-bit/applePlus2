import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { PaymeState } from '../../../common/enums/payme.enum';
import { Order } from '../../orders/entities/order.entity';

/**
 * A Payme (Paycom) Merchant API transaction. Payme owns this lifecycle and
 * drives it via JSON-RPC callbacks, so it is tracked separately from the
 * provider-agnostic `payments` ledger.
 */
@Entity('payme_transactions')
export class PaymeTransaction extends BaseEntity {
  // Payme's own transaction id — unique guarantees CreateTransaction idempotency.
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  paymeId: string;

  @Index()
  @Column({ type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  // Amount in tiyin (1 UZS = 100 tiyin), as sent by Payme.
  @Column({ type: 'bigint' })
  amount: string;

  @Column({ type: 'smallint', default: PaymeState.CREATED })
  state: PaymeState;

  // Payme timestamps are milliseconds since epoch; 0 means "not set yet".
  @Column({ type: 'bigint', default: 0 })
  paymeCreateTime: string;

  @Column({ type: 'bigint', default: 0 })
  performTime: string;

  @Column({ type: 'bigint', default: 0 })
  cancelTime: string;

  // Payme cancellation reason code (set on CancelTransaction).
  @Column({ type: 'int', nullable: true })
  reason: number | null;
}
