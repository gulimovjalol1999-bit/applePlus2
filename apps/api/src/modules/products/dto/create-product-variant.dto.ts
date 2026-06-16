import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateProductVariantDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sku: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({ minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price: number;

  @ApiPropertyOptional({ minimum: 0.01, nullable: true })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @IsOptional()
  salePrice?: number;

  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'string' } })
  @IsObject()
  @IsOptional()
  attributes?: Record<string, string>;

  @ApiPropertyOptional({ minimum: 0, nullable: true })
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  @IsOptional()
  weightKg?: number;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ minimum: 0, default: 0, description: 'Initial stock quantity' })
  @IsInt()
  @Min(0)
  @IsOptional()
  initialQuantity?: number;

  @ApiPropertyOptional({ minimum: 0, default: 5 })
  @IsInt()
  @Min(0)
  @IsOptional()
  reorderLevel?: number;

  @ApiPropertyOptional({ maxLength: 100, nullable: true })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  warehouseLocation?: string;
}
