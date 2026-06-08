import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus } from '../../../common/enums/product-status.enum';

export class ProductImageDto {
  @ApiProperty() id: string;
  @ApiProperty() url: string;
  @ApiPropertyOptional({ nullable: true }) altText: string | null;
  @ApiProperty() sortOrder: number;
  @ApiProperty() isPrimary: boolean;
  @ApiPropertyOptional({ nullable: true }) variantId: string | null;
}

export class ProductVariantDto {
  @ApiProperty() id: string;
  @ApiProperty() sku: string;
  @ApiProperty() name: string;
  @ApiProperty() price: number;
  @ApiPropertyOptional({ nullable: true }) salePrice: number | null;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } })
  attributes: Record<string, string>;
  @ApiProperty() isDefault: boolean;
  @ApiProperty() isActive: boolean;
}

export class ProductResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() categoryId: string;
  @ApiPropertyOptional({ nullable: true }) categoryName: string | null;
  @ApiProperty() brandId: string;
  @ApiPropertyOptional({ nullable: true }) brandName: string | null;
  @ApiProperty() name: string;
  @ApiProperty() slug: string;
  @ApiPropertyOptional({ nullable: true }) description: string | null;
  @ApiPropertyOptional({ nullable: true }) shortDescription: string | null;
  @ApiProperty() basePrice: number;
  @ApiPropertyOptional({ nullable: true }) salePrice: number | null;
  @ApiProperty({ enum: ProductStatus }) status: ProductStatus;
  @ApiProperty({ type: [String] }) tags: string[];
  @ApiPropertyOptional({ nullable: true }) metaTitle: string | null;
  @ApiPropertyOptional({ nullable: true }) metaDescription: string | null;
  @ApiProperty() averageRating: number;
  @ApiProperty() reviewCount: number;
  @ApiProperty() variantCount: number;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
  @ApiPropertyOptional({ type: [ProductImageDto], nullable: true })
  images?: ProductImageDto[];
  @ApiPropertyOptional({ type: [ProductVariantDto], nullable: true })
  variants?: ProductVariantDto[];
}
