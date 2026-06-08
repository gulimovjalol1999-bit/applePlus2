import {
  Check,
  Column,
  Entity,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum CouponType {
  PERCENT = 'percent',
  FIXED = 'fixed',
}

@Check('"value" > 0')
@Check('"used_count" >= 0')
@Entity('coupons')
export class Coupon extends BaseEntity {
  @Column({ length: 50, unique: true })
  code: string;

  @Column({ type: 'enum', enum: CouponType })
  type: CouponType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  value: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  minOrderAmount: number | null;

  @Column({ type: 'int', nullable: true })
  maxUses: number | null;

  @Column({ type: 'int', default: 0 })
  usedCount: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  startsAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null;
}
