import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Product } from './product.entity';
import { ProductImage } from './product-image.entity';

@Check('"price" > 0')
@Entity('product_variants')
export class ProductVariant extends BaseEntity {
  @Column({ type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product, (p) => p.variants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ length: 100, unique: true })
  sku: string;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  salePrice: number | null;

  @Column({ type: 'jsonb', default: '{}' })
  attributes: Record<string, string>;

  @Column({ type: 'decimal', precision: 8, scale: 3, nullable: true })
  weightKg: number | null;

  @Column({ default: false })
  isDefault: boolean;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => ProductImage, (img) => img.variant)
  images: ProductImage[];
}
