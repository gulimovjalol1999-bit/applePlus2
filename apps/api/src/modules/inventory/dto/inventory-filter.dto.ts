import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class InventoryFilterDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by variant SKU or product name' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  brandId?: string;

  @ApiPropertyOptional({ description: 'quantity <= reorderLevel' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  lowStock?: boolean;

  @ApiPropertyOptional({ description: 'availableQuantity == 0' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  outOfStock?: boolean;

  @ApiPropertyOptional({ enum: ['quantity', 'sku', 'updatedAt'], default: 'updatedAt' })
  @IsString()
  @IsOptional()
  sortBy?: 'quantity' | 'sku' | 'updatedAt' = 'updatedAt';
}
