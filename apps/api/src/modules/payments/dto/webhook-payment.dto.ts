import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaymentStatus } from '../../../common/enums/payment-status.enum';

export class WebhookPaymentDto {
  @ApiProperty({ description: 'Our internal Payment record UUID' })
  @IsUUID()
  internalId: string;

  @ApiProperty({ enum: PaymentStatus })
  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @ApiPropertyOptional({ description: "Provider's own transaction reference" })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  providerPaymentId?: string;

  @ApiPropertyOptional({ description: 'Provider-specific event data stored for audit' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
