import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CarrierLockStatus } from '../../../common/enums/carrier-lock-status.enum';
import { ProductStatus } from '../../../common/enums/product-status.enum';
import { UsedPhoneConditionGrade } from '../../../common/enums/used-phone-condition.enum';
import { UsedPhoneWarrantyType } from '../../../common/enums/used-phone-warranty.enum';
import {
  UsedPhoneDefect,
  UsedPhoneRepairRecord,
} from '../../inventory/entities/used-phone-details.entity';
import { ProductImageDto } from '../../products/dto/product-response.dto';
import { UsedPhoneDefectDto, UsedPhoneRepairRecordDto } from './create-used-phone.dto';

export class UsedPhoneResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() slug: string;
  @ApiPropertyOptional({ nullable: true }) description: string | null;
  @ApiProperty() status: ProductStatus;
  @ApiProperty() categoryId: string;
  @ApiPropertyOptional({ nullable: true }) categoryName: string | null;
  @ApiProperty() brandId: string;
  @ApiPropertyOptional({ nullable: true }) brandName: string | null;
  @ApiProperty({ type: [ProductImageDto] }) images: ProductImageDto[];

  @ApiProperty() variantId: string;
  @ApiProperty() sku: string;
  @ApiProperty() price: number;
  @ApiPropertyOptional({ nullable: true }) salePrice: number | null;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } })
  attributes: Record<string, string>;

  @ApiProperty() quantity: number;
  @ApiProperty() availableQuantity: number;
  @ApiProperty() soldCount: number;

  @ApiProperty() imei: string;
  @ApiPropertyOptional({ nullable: true }) imei2: string | null;
  @ApiPropertyOptional({ nullable: true }) serialNumber: string | null;
  @ApiProperty({ enum: UsedPhoneConditionGrade }) conditionGrade: UsedPhoneConditionGrade;
  @ApiProperty() batteryHealthPercent: number;
  @ApiProperty({ type: [UsedPhoneDefectDto] }) defects: UsedPhoneDefect[];
  @ApiProperty({ type: [UsedPhoneRepairRecordDto] }) repairHistory: UsedPhoneRepairRecord[];
  @ApiProperty({ type: [String] }) includedAccessories: string[];
  @ApiProperty({ enum: UsedPhoneWarrantyType }) warrantyType: UsedPhoneWarrantyType;
  @ApiPropertyOptional({ nullable: true }) warrantyExpiresAt: string | null;
  @ApiProperty({ enum: CarrierLockStatus }) carrierLockStatus: CarrierLockStatus;
  @ApiPropertyOptional({ nullable: true }) region: string | null;
  @ApiProperty() purchaseCostPrice: number;
  @ApiPropertyOptional({ nullable: true }) gradeNotes: string | null;
  @ApiPropertyOptional({ nullable: true }) soldAt: string | null;

  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}
