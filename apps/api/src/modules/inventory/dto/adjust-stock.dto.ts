import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AdjustStockDto {
  @ApiProperty({ description: 'Positive = add stock, negative = remove stock' })
  @IsInt()
  @IsNotEmpty()
  adjustment: number;

  @ApiProperty({ maxLength: 500, example: 'Received PO #1234' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}
