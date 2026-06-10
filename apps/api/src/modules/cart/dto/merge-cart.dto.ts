import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class MergeCartDto {
  @ApiProperty({ description: 'Guest session ID to merge into user cart' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}
