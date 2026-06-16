import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreatePaymeCheckoutDto {
  @ApiProperty({ description: 'Order to pay for' })
  @IsUUID()
  orderId: string;
}

export class PaymeCheckoutResponseDto {
  @ApiProperty({ description: 'Payme hosted checkout URL to redirect the customer to' })
  url: string;
}
