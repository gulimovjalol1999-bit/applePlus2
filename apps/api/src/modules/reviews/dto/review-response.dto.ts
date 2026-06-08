import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() productId: string;
  @ApiProperty() userId: string;
  @ApiPropertyOptional({ nullable: true }) orderId: string | null;
  @ApiProperty() rating: number;
  @ApiPropertyOptional({ nullable: true }) title: string | null;
  @ApiPropertyOptional({ nullable: true }) body: string | null;
  @ApiProperty() isApproved: boolean;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}
