import { ApiProperty } from '@nestjs/swagger';

export class WishlistItemResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() productId: string;
  @ApiProperty() productName: string;
  @ApiProperty() productSlug: string;
  @ApiProperty() basePrice: number;
  @ApiProperty() createdAt: string;
}
