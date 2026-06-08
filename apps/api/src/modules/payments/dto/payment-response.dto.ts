import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus } from '../../../common/enums/payment-status.enum';

export class PaymentResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() orderId: string;
  @ApiProperty({ enum: PaymentStatus }) status: PaymentStatus;
  @ApiProperty() provider: string;
  @ApiPropertyOptional({ nullable: true }) providerPaymentId: string | null;
  @ApiProperty() amount: number;
  @ApiProperty() currency: string;
  @ApiProperty() metadata: Record<string, unknown>;
  @ApiPropertyOptional({ nullable: true }) paidAt: string | null;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}
