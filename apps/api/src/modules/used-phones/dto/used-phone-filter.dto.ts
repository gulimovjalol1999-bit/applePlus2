import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { CarrierLockStatus } from '../../../common/enums/carrier-lock-status.enum';
import { ProductStatus } from '../../../common/enums/product-status.enum';
import { UsedPhoneConditionGrade } from '../../../common/enums/used-phone-condition.enum';
import { UsedPhoneWarrantyType } from '../../../common/enums/used-phone-warranty.enum';

export class UsedPhoneFilterDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by product name, IMEI, or serial number' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  brandId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ enum: UsedPhoneConditionGrade })
  @IsEnum(UsedPhoneConditionGrade)
  @IsOptional()
  conditionGrade?: UsedPhoneConditionGrade;

  @ApiPropertyOptional({ enum: CarrierLockStatus })
  @IsEnum(CarrierLockStatus)
  @IsOptional()
  carrierLockStatus?: CarrierLockStatus;

  @ApiPropertyOptional({ enum: UsedPhoneWarrantyType })
  @IsEnum(UsedPhoneWarrantyType)
  @IsOptional()
  warrantyType?: UsedPhoneWarrantyType;

  @ApiPropertyOptional({ enum: ProductStatus })
  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @ApiPropertyOptional({ minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minPrice?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxPrice?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  minBattery?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  maxBattery?: number;

  @ApiPropertyOptional({ enum: ['price', 'createdAt', 'batteryHealthPercent'], default: 'createdAt' })
  @IsString()
  @IsOptional()
  sortBy?: 'price' | 'createdAt' | 'batteryHealthPercent' = 'createdAt';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsString()
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
