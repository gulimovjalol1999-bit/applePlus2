import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '../../../common/enums/order-status.enum';

export class OrderItemResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() productId: string;
  @ApiProperty() variantId: string;
  @ApiProperty() productName: string;
  @ApiProperty() quantity: number;
  @ApiProperty() unitPrice: number;
  @ApiProperty() totalPrice: number;
}

export class OrderResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() orderNumber: string;
  @ApiProperty() userId: string;
  @ApiPropertyOptional() couponId: string | null;
  @ApiPropertyOptional() shippingAddressId: string | null;
  @ApiProperty({ enum: OrderStatus }) status: OrderStatus;
  @ApiProperty() totalAmount: number;
  @ApiProperty() discountAmount: number;
  @ApiProperty() shippingAmount: number;
  @ApiPropertyOptional() notes: string | null;
  @ApiProperty({ type: [OrderItemResponseDto] }) items: OrderItemResponseDto[];
  @ApiProperty() createdAt: string;
}
