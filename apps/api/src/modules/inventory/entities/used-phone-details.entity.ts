import {
  Check,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CarrierLockStatus } from '../../../common/enums/carrier-lock-status.enum';
import { UsedPhoneConditionGrade } from '../../../common/enums/used-phone-condition.enum';
import { UsedPhoneWarrantyType } from '../../../common/enums/used-phone-warranty.enum';
import { InventoryItem } from './inventory-item.entity';

export interface UsedPhoneDefect {
  part: string;
  description: string;
  severity: 'minor' | 'major';
}

export interface UsedPhoneRepairRecord {
  date: string;
  description: string;
}

@Check('"battery_health_percent" BETWEEN 0 AND 100')
@Check('"purchase_cost_price" > 0')
@Entity('used_phone_details')
export class UsedPhoneDetails {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  inventoryItemId: string;

  @OneToOne(() => InventoryItem, (item) => item.usedPhoneDetails, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inventory_item_id' })
  inventoryItem: InventoryItem;

  @Column({ length: 20, unique: true })
  imei: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  imei2: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  serialNumber: string | null;

  @Column({ type: 'enum', enum: UsedPhoneConditionGrade })
  conditionGrade: UsedPhoneConditionGrade;

  @Column({ type: 'smallint' })
  batteryHealthPercent: number;

  @Column({ type: 'jsonb', default: '[]' })
  defects: UsedPhoneDefect[];

  @Column({ type: 'jsonb', default: '[]' })
  repairHistory: UsedPhoneRepairRecord[];

  @Column({ type: 'text', array: true, default: '{}' })
  includedAccessories: string[];

  @Column({ type: 'enum', enum: UsedPhoneWarrantyType, default: UsedPhoneWarrantyType.NONE })
  warrantyType: UsedPhoneWarrantyType;

  @Column({ type: 'timestamptz', nullable: true })
  warrantyExpiresAt: Date | null;

  @Column({ type: 'enum', enum: CarrierLockStatus, default: CarrierLockStatus.UNKNOWN })
  carrierLockStatus: CarrierLockStatus;

  @Column({ type: 'varchar', length: 50, nullable: true })
  region: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  purchaseCostPrice: number;

  @Column({ type: 'text', nullable: true })
  gradeNotes: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  soldAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
