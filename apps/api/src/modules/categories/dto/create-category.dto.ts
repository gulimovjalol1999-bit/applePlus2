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

export class CreateCategoryDto {
  @ApiProperty({ maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({ nullable: true })
  @IsUUID()
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ maxLength: 500, nullable: true })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ maxLength: 160, nullable: true })
  @IsString()
  @MaxLength(160)
  @IsOptional()
  metaTitle?: string;

  @ApiPropertyOptional({ maxLength: 320, nullable: true })
  @IsString()
  @MaxLength(320)
  @IsOptional()
  metaDescription?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
