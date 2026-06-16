import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductImageDto {
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

  @ApiPropertyOptional({ nullable: true })
  @IsUUID()
  @IsOptional()
  variantId?: string;
}
