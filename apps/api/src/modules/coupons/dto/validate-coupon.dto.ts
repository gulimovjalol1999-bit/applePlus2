import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsString, MaxLength } from 'class-validator';

export class ValidateCouponDto {
  @ApiProperty({ maxLength: 50 })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  orderAmount: number;
}
