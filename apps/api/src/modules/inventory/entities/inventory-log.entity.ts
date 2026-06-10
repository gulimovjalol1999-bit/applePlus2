import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { InventoryItem } from './inventory-item.entity';

export enum InventoryEventType {
  MANUAL = 'manual',
  ORDER_RESERVE = 'order_reserve',
  ORDER_RELEASE = 'order_release',
  ORDER_COMMIT = 'order_commit',
}

@Entity('inventory_logs')
export class InventoryLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  inventoryItemId: string;

  @ManyToOne(() => InventoryItem, (item) => item.logs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inventory_item_id' })
  inventoryItem: InventoryItem;

  @Column({ type: 'enum', enum: InventoryEventType, default: InventoryEventType.MANUAL })
  eventType: InventoryEventType;

  /** Delta applied. For MANUAL/ORDER_COMMIT: delta to quantity. For RESERVE/RELEASE: delta to reservedQuantity. */
  @Column({ type: 'int' })
  adjustment: number;

  @Column({ type: 'int' })
  quantityBefore: number;

  @Column({ type: 'int' })
  quantityAfter: number;

  @Column({ length: 500 })
  reason: string;

  /** Soft FK to users — intentionally not a hard FK so system events (null) and deleted users don't break logs. */
  @Column({ type: 'uuid', nullable: true })
  performedById: string | null;

  /** Snapshot of the performer's email at action time. Preserved even after user deletion. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  performedByEmail: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
