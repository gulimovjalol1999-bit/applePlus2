import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShipmentStatus } from '../../../common/enums/shipment-status.enum';

export class AddressResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() userId: string;
  @ApiProperty() label: string;
  @ApiProperty() fullName: string;
  @ApiProperty() phone: string;
  @ApiProperty() addressLine: string;
  @ApiProperty() city: string;
  @ApiPropertyOptional({ nullable: true }) region: string | null;
  @ApiPropertyOptional({ nullable: true }) postalCode: string | null;
  @ApiProperty() country: string;
  @ApiProperty() isDefault: boolean;
  @ApiProperty() createdAt: string;
}

export class ShipmentResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() orderId: string;
  @ApiProperty() carrier: string;
  @ApiPropertyOptional({ nullable: true }) trackingNumber: string | null;
  @ApiProperty({ enum: ShipmentStatus }) status: ShipmentStatus;
  @ApiPropertyOptional({ nullable: true }) estimatedAt: string | null;
  @ApiPropertyOptional({ nullable: true }) deliveredAt: string | null;
  @ApiProperty() shippingAddress: Record<string, unknown>;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}
