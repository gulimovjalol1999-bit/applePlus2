import { ApiProperty } from '@nestjs/swagger';

export class DailySalesRowDto {
  @ApiProperty({ example: '2026-06-04' }) date!: string;
  @ApiProperty({ example: 42 }) orderCount!: number;
  @ApiProperty({ type: 'string', example: '1234.50', description: 'Decimal string to preserve precision' })
  revenue!: string;
}

export class MonthlyRevenueRowDto {
  @ApiProperty({ example: 2026 }) year!: number;
  @ApiProperty({ example: 6, description: '1–12' }) month!: number;
  @ApiProperty({ example: 120 }) orderCount!: number;
  @ApiProperty({ type: 'string', example: '45600.00', description: 'Decimal string to preserve precision' })
  revenue!: string;
}

export class TopProductRowDto {
  @ApiProperty() productId!: string;
  @ApiProperty() productName!: string;
  @ApiProperty({ example: 300 }) totalQuantity!: number;
  @ApiProperty({ type: 'string', example: '9870.00', description: 'Decimal string to preserve precision' })
  totalRevenue!: string;
}

export class TopCategoryRowDto {
  @ApiProperty() categoryId!: string;
  @ApiProperty() categoryName!: string;
  @ApiProperty({ example: 500 }) totalQuantity!: number;
  @ApiProperty({ type: 'string', example: '25000.00', description: 'Decimal string to preserve precision' })
  totalRevenue!: string;
}
