import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { InventoryLog } from './inventory-log.entity';

@Check('"quantity" >= 0')
@Check('"reserved_quantity" >= 0')
@Check('"reserved_quantity" <= "quantity"')
@Check('"sold_count" >= 0')
@Check('"reorder_level" >= 0')
@Entity('inventory_items')
export class InventoryItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  variantId: string;

  @OneToOne(() => ProductVariant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variant_id' })
  variant: ProductVariant;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @Column({ type: 'int', default: 0 })
  reservedQuantity: number;

  @Column({ type: 'int', default: 0 })
  soldCount: number;

  @Column({ type: 'int', default: 5 })
  reorderLevel: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  warehouseLocation: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => InventoryLog, (log) => log.inventoryItem)
  logs: InventoryLog[];

  get availableQuantity(): number {
    return this.quantity - this.reservedQuantity;
  }
}
