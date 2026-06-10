import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { STORAGE_KEY_REGEX } from '../uploads.constants';

export class ConfirmUploadDto {
  @ApiProperty({ example: 'images/550e8400-e29b-41d4-a716-446655440000.jpg' })
  @IsString()
  @IsNotEmpty()
  @Matches(STORAGE_KEY_REGEX, { message: 'Invalid storage key' })
  key: string;
}
