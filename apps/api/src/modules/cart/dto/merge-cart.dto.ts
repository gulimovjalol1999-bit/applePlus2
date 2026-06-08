import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class MergeCartDto {
  @ApiPropertyOptional({ description: 'Guest session ID to merge into user cart' })
  @IsString()
  @IsOptional()
  sessionId?: string;
}
