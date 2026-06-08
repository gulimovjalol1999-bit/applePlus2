import { ApiProperty } from '@nestjs/swagger';

export class DailySalesRowDto {
  @ApiProperty({ example: '2026-06-04' }) date: string;
  @ApiProperty() orderCount: number;
  @ApiProperty() revenue: number;
}

export class MonthlyRevenueRowDto {
  @ApiProperty({ example: 2026 }) year: number;
  @ApiProperty({ example: 6, description: '1–12' }) month: number;
  @ApiProperty() orderCount: number;
  @ApiProperty() revenue: number;
}

export class TopProductRowDto {
  @ApiProperty() productId: string;
  @ApiProperty() productName: string;
  @ApiProperty() totalQuantity: number;
  @ApiProperty() totalRevenue: number;
}

export class TopCategoryRowDto {
  @ApiProperty() categoryId: string;
  @ApiProperty() categoryName: string;
  @ApiProperty() totalQuantity: number;
  @ApiProperty() totalRevenue: number;
}
