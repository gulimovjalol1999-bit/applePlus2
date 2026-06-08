import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Max, Min } from 'class-validator';

export class DateRangeDto {
  @ApiPropertyOptional({ example: '2026-01-01', description: 'ISO date (inclusive)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31', description: 'ISO date (inclusive)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class DailySalesQueryDto extends DateRangeDto {}

export class MonthlyRevenueQueryDto {
  @ApiPropertyOptional({ example: 2026, description: 'Full year (defaults to current year)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;
}

export class TopListQueryDto extends DateRangeDto {
  @ApiPropertyOptional({ example: 10, default: 10, description: 'Number of results' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
