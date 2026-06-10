import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Max, MaxLength, Min } from 'class-validator';

export class AdjustStockDto {
  @ApiProperty({ description: 'Positive = add stock, negative = remove stock', minimum: -1000000, maximum: 1000000 })
  @IsInt()
  @Min(-1000000)
  @Max(1000000)
  @IsNotEmpty()
  adjustment: number;

  @ApiProperty({ maxLength: 500, example: 'Received PO #1234' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}
