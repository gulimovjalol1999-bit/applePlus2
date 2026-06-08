import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { PaymentStatus } from '../../../common/enums/payment-status.enum';
import { Order } from '../../orders/entities/order.entity';

@Check('"amount" > 0')
@Entity('payments')
export class Payment extends BaseEntity {
  @Column({ type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ length: 50 })
  provider: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  providerPaymentId: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ length: 10, default: 'USD' })
  currency: string;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, unknown>;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt: Date | null;
}
