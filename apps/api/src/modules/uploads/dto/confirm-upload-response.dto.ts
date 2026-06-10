import { ApiProperty } from '@nestjs/swagger';
import { StorageObjectStatus } from '../../../common/enums/storage-object-status.enum';

export class ConfirmUploadResponseDto {
  @ApiProperty({ example: 'images/550e8400-e29b-41d4-a716-446655440000.jpg' })
  key: string;

  @ApiProperty({ example: 'https://minio.example.com/apple-plus/images/abc.jpg' })
  url: string;

  @ApiProperty({ enum: StorageObjectStatus, example: StorageObjectStatus.CONFIRMED })
  status: StorageObjectStatus;
}
