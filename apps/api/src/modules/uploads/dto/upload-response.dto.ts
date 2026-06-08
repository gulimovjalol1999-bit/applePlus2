import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty({ example: 'https://minio.example.com/apple-plus/images/abc.jpg' })
  url: string;

  @ApiProperty({ example: 'images/550e8400-e29b-41d4-a716-446655440000.jpg' })
  key: string;
}
