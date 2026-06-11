import { Check, Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { OrderStatus } from '../../../common/enums/order-status.enum';
import { OrderItem } from './order-item.entity';

@Check('"total_amount" >= 0')
@Check('"discount_amount" >= 0')
@Check('"shipping_amount" >= 0')
@Entity('orders')
export class Order extends BaseEntity {
  @Column({ length: 30, unique: true })
  orderNumber: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  couponId: string | null;

  @Column({ type: 'uuid', nullable: true })
  shippingAddressId: string | null;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.NEW })
  status: OrderStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  shippingAmount: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];
}
