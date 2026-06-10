import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty()
  @IsUUID()
  orderId: string;

  @ApiProperty({ maxLength: 50, example: 'stripe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  provider: string;

  @ApiPropertyOptional({ default: 'USD', pattern: '^[A-Z]{3}$' })
  @IsString()
  @Matches(/^[A-Z]{3}$/, { message: 'currency must be a 3-letter ISO 4217 code (e.g. USD)' })
  @IsOptional()
  currency?: string;

  @ApiProperty({
    description: 'Unique key per payment attempt — server returns existing payment on duplicate',
    maxLength: 64,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  idempotencyKey: string;
}
