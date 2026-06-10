import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsPositive, IsString, MaxLength } from 'class-validator';

export class ValidateCouponDto {
  @ApiProperty({ maxLength: 50, example: 'SUMMER20' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase().trim() : value))
  code: string;

  @ApiProperty({ minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  orderAmount: number;
}
