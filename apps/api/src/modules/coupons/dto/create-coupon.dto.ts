import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { CouponType } from '../entities/coupon.entity';

export class CreateCouponDto {
  @ApiProperty({ maxLength: 50, pattern: '^[A-Z0-9_-]+$', example: 'SUMMER20' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(/^[A-Z0-9_-]+$/i, { message: 'code must contain only letters, numbers, underscores and dashes' })
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase().trim() : value))
  code: string;

  @ApiProperty({ enum: CouponType })
  @IsEnum(CouponType)
  type: CouponType;

  @ApiProperty({ minimum: 0.01, description: 'For PERCENT type: 0.01–100. For FIXED type: positive amount.' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @IsPositive()
  @ValidateIf((o) => o.type === CouponType.PERCENT)
  @Max(100, { message: 'Percent coupon value must not exceed 100' })
  value: number;

  @ApiPropertyOptional({ nullable: true })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @IsOptional()
  minOrderAmount?: number;

  @ApiPropertyOptional({ nullable: true })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxUses?: number;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ nullable: true })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  startsAt?: Date;

  @ApiPropertyOptional({ nullable: true })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  expiresAt?: Date;
}
