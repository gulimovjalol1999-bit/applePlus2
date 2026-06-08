import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InventoryItemDto {
  @ApiProperty() id: string;
  @ApiProperty() variantId: string;
  @ApiProperty() sku: string;
  @ApiProperty() variantName: string;
  @ApiProperty() productId: string;
  @ApiProperty() productName: string;
  @ApiProperty() quantity: number;
  @ApiProperty() reservedQuantity: number;
  @ApiProperty() availableQuantity: number;
  @ApiProperty() soldCount: number;
  @ApiProperty() reorderLevel: number;
  @ApiPropertyOptional({ nullable: true }) warehouseLocation: string | null;
  @ApiProperty() updatedAt: string;
}
