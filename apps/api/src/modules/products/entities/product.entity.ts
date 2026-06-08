import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ProductStatus } from '../../../common/enums/product-status.enum';
import { Brand } from '../../brands/brand.entity';
import { Category } from '../../categories/category.entity';
import { ProductImage } from './product-image.entity';
import { ProductVariant } from './product-variant.entity';

@Check('"base_price" > 0')
@Check('"sale_price" IS NULL OR "sale_price" > 0')
@Check('"average_rating" BETWEEN 0 AND 5')
@Check('"review_count" >= 0')
@Entity('products')
export class Product extends BaseEntity {
  @Column({ type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => Category, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ type: 'uuid' })
  brandId: string;

  @ManyToOne(() => Brand, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'brand_id' })
  brand: Brand;

  @Column({ length: 300 })
  name: string;

  @Column({ length: 350, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  shortDescription: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  basePrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  salePrice: number | null;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.DRAFT,
  })
  status: ProductStatus;

  @Column({ type: 'text', array: true, default: '{}' })
  tags: string[];

  @Column({ type: 'varchar', length: 160, nullable: true })
  metaTitle: string | null;

  @Column({ type: 'varchar', length: 320, nullable: true })
  metaDescription: string | null;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating: number;

  @Column({ type: 'int', default: 0 })
  reviewCount: number;

  @Column({ type: 'uuid', nullable: true })
  createdById: string | null;

  @Column({ type: 'uuid', nullable: true })
  updatedById: string | null;

  @OneToMany(() => ProductVariant, (v) => v.product, { cascade: true })
  variants: ProductVariant[];

  @OneToMany(() => ProductImage, (img) => img.product, { cascade: true })
  images: ProductImage[];
}
