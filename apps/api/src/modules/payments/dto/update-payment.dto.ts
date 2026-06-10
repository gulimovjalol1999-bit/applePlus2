import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaymentStatus } from '../../../common/enums/payment-status.enum';

export class UpdatePaymentDto {
  @ApiProperty({ enum: PaymentStatus })
  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @ApiPropertyOptional({ nullable: true })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  providerPaymentId?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
  // paidAt is server-set only (set to now() when status transitions to PAID)
}
