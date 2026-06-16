import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CarrierLockStatus } from '../../../common/enums/carrier-lock-status.enum';
import { ProductStatus } from '../../../common/enums/product-status.enum';
import { ProductType } from '../../../common/enums/product-type.enum';
import { UsedPhoneConditionGrade } from '../../../common/enums/used-phone-condition.enum';
import { UsedPhoneWarrantyType } from '../../../common/enums/used-phone-warranty.enum';
import { UsedPhoneDefect } from '../../inventory/entities/used-phone-details.entity';

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
  @ApiPropertyOptional({ nullable: true }) weightKg: number | null;
  @ApiPropertyOptional({ nullable: true }) quantity: number | null;
  @ApiPropertyOptional({ nullable: true }) availableQuantity: number | null;
  @ApiPropertyOptional({ nullable: true }) reorderLevel: number | null;
  @ApiPropertyOptional({ nullable: true }) warehouseLocation: string | null;
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
  @ApiProperty({ enum: ProductType }) productType: ProductType;
  @ApiPropertyOptional({ enum: UsedPhoneConditionGrade, nullable: true })
  conditionGrade?: UsedPhoneConditionGrade | null;
  @ApiPropertyOptional({ nullable: true }) batteryHealthPercent?: number | null;
  @ApiPropertyOptional({ enum: UsedPhoneWarrantyType, nullable: true })
  warrantyType?: UsedPhoneWarrantyType | null;
  @ApiPropertyOptional({ enum: CarrierLockStatus, nullable: true })
  carrierLockStatus?: CarrierLockStatus | null;
  @ApiPropertyOptional({ type: [String], nullable: true })
  includedAccessories?: string[] | null;
  @ApiPropertyOptional({ nullable: true }) region?: string | null;
  @ApiPropertyOptional({ type: [Object], nullable: true }) defects?: UsedPhoneDefect[] | null;
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
