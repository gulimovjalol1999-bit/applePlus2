import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsEnum, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
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

  @ApiPropertyOptional({ nullable: true })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  paidAt?: Date;
}
