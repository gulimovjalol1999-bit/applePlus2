import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CartItemResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() variantId: string;
  @ApiProperty() productId: string;
  @ApiProperty() productName: string;
  @ApiProperty() variantName: string;
  @ApiProperty() sku: string;
  @ApiPropertyOptional({ nullable: true }) imageUrl: string | null;
  @ApiProperty() price: number;
  @ApiPropertyOptional({ nullable: true }) salePrice: number | null;
  @ApiProperty() quantity: number;
  @ApiProperty() lineTotal: number;
}

export class CartResponseDto {
  @ApiProperty() id: string;
  @ApiProperty({ type: () => [CartItemResponseDto] }) items: CartItemResponseDto[];
  @ApiProperty() subtotal: number;
  @ApiProperty() itemCount: number;
}
