import { ApiProperty } from '@nestjs/swagger';

export class PresignedUrlResponseDto {
  @ApiProperty({ description: 'Signed URL for uploading directly to MinIO/S3 via PUT request' })
  uploadUrl: string;

  @ApiProperty({ example: 'images/550e8400-e29b-41d4-a716-446655440000.jpg' })
  key: string;

  @ApiProperty({ description: 'Public URL of the file after upload completes' })
  publicUrl: string;

  @ApiProperty({ example: 300, description: 'URL expiry time in seconds' })
  expiresIn: number;
}
