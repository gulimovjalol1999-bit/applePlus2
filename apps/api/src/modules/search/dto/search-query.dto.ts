import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsString, IsUUID, MaxLength } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class SearchQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search term' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  q?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  brandId?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @IsOptional()
  minPrice?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @IsOptional()
  maxPrice?: number;
}
