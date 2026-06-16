import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CarrierLockStatus } from '../../../common/enums/carrier-lock-status.enum';
import { UsedPhoneConditionGrade } from '../../../common/enums/used-phone-condition.enum';
import { UsedPhoneWarrantyType } from '../../../common/enums/used-phone-warranty.enum';

const IMEI_PATTERN = /^\d{15}$/;

export class UsedPhoneImageDto {
  @ApiProperty({ maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  url: string;

  @ApiPropertyOptional({ maxLength: 255, nullable: true })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  altText?: string;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}

export class UsedPhoneDefectDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  part: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: ['minor', 'major'] })
  @IsEnum(['minor', 'major'] as const)
  severity: 'minor' | 'major';
}

export class UsedPhoneRepairRecordDto {
  @ApiProperty()
  @IsDateString()
  date: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;
}

export class CreateUsedPhoneDto {
  // ── Product ──────────────────────────────────────────────────────────────

  @ApiProperty({ maxLength: 300 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  name: string;

  @ApiProperty()
  @IsUUID()
  brandId: string;

  @ApiProperty()
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({ type: 'string', nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ type: [UsedPhoneImageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UsedPhoneImageDto)
  @IsOptional()
  images?: UsedPhoneImageDto[];

  // ── Variant ──────────────────────────────────────────────────────────────

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sku: string;

  @ApiProperty({ minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price: number;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: { type: 'string' },
    description: 'e.g. { "storage": "128GB", "color": "Midnight" }',
  })
  @IsObject()
  @IsOptional()
  attributes?: Record<string, string>;

  // ── Used phone details ──────────────────────────────────────────────────

  @ApiProperty({ description: '15-digit IMEI', example: '123456789012345' })
  @IsString()
  @Matches(IMEI_PATTERN, { message: 'imei must be exactly 15 digits' })
  imei: string;

  @ApiPropertyOptional({ description: '15-digit IMEI2 (dual-SIM devices)', nullable: true })
  @IsString()
  @Matches(IMEI_PATTERN, { message: 'imei2 must be exactly 15 digits' })
  @IsOptional()
  imei2?: string;

  @ApiPropertyOptional({ maxLength: 100, nullable: true })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  serialNumber?: string;

  @ApiProperty({ enum: UsedPhoneConditionGrade })
  @IsEnum(UsedPhoneConditionGrade)
  conditionGrade: UsedPhoneConditionGrade;

  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  batteryHealthPercent: number;

  @ApiPropertyOptional({ type: [UsedPhoneDefectDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UsedPhoneDefectDto)
  @IsOptional()
  defects?: UsedPhoneDefectDto[];

  @ApiPropertyOptional({ type: [UsedPhoneRepairRecordDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UsedPhoneRepairRecordDto)
  @IsOptional()
  repairHistory?: UsedPhoneRepairRecordDto[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  includedAccessories?: string[];

  @ApiPropertyOptional({ enum: UsedPhoneWarrantyType, default: UsedPhoneWarrantyType.NONE })
  @IsEnum(UsedPhoneWarrantyType)
  @IsOptional()
  warrantyType?: UsedPhoneWarrantyType;

  @ApiPropertyOptional({ nullable: true })
  @IsDateString()
  @IsOptional()
  warrantyExpiresAt?: string;

  @ApiPropertyOptional({ enum: CarrierLockStatus, default: CarrierLockStatus.UNKNOWN })
  @IsEnum(CarrierLockStatus)
  @IsOptional()
  carrierLockStatus?: CarrierLockStatus;

  @ApiPropertyOptional({ maxLength: 50, nullable: true })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  region?: string;

  @ApiProperty({ minimum: 0.01, description: 'Internal purchase cost (margin calculation)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  purchaseCostPrice: number;

  @ApiPropertyOptional({ type: 'string', nullable: true })
  @IsString()
  @IsOptional()
  gradeNotes?: string;
}
