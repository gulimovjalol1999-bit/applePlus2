import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreatePaymeCheckoutDto {
  @ApiProperty({ description: 'Order to pay for' })
  @IsUUID()
  orderId: string;
}

export class PaymeCheckoutResponseDto {
  @ApiProperty({
    nullable: true,
    description:
      'Payme hosted checkout URL to redirect the customer to, or null when Payme is not configured (skip payment).',
  })
  url: string | null;
}
