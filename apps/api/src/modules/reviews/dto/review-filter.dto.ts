import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ReviewFilterDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  productId?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  isApproved?: boolean;

  @ApiPropertyOptional({ enum: ['createdAt', 'rating'], default: 'createdAt' })
  @IsString()
  @IsOptional()
  sortBy?: 'createdAt' | 'rating' = 'createdAt';
}
