import { ApiProperty } from '@nestjs/swagger';

export class MarkUsedPhoneSoldResponseDto {
  @ApiProperty() productId: string;
  @ApiProperty() inventoryId: string;
  @ApiProperty() sold: boolean;
  @ApiProperty() soldAt: string;
}
