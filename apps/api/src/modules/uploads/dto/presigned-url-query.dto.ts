import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches, IsOptional, IsIn, IsInt, Min, Max } from 'class-validator';
import { MAX_FILE_SIZE } from '../uploads.constants';

const ALLOWED_FOLDERS = ['images', 'avatars', 'documents'] as const;
type UploadFolder = (typeof ALLOWED_FOLDERS)[number];

export class PresignedUrlQueryDto {
  @ApiProperty({ example: 'product-image.jpg', description: 'Original filename including extension' })
  @IsString()
  @IsNotEmpty()
  filename: string;

  @ApiProperty({ example: 'image/jpeg', description: 'MIME type of the file to be uploaded' })
  @IsString()
  @Matches(/^(image\/(jpeg|jpg|png|webp|gif)|application\/pdf)$/, {
    message: 'contentType must be one of: image/jpeg, image/png, image/webp, image/gif, application/pdf',
  })
  contentType: string;

  @ApiPropertyOptional({
    example: 'images',
    enum: ALLOWED_FOLDERS,
    default: 'images',
    description: 'Storage folder',
  })
  @IsOptional()
  @IsIn(ALLOWED_FOLDERS)
  folder?: UploadFolder = 'images';

  @ApiProperty({
    example: 1048576,
    description:
      'Exact size of the file in bytes. The upload URL is signed to require this exact ' +
      'Content-Length, so uploads larger than the configured limit are rejected by storage.',
  })
  @IsInt()
  @Min(1)
  @Max(MAX_FILE_SIZE)
  contentLength: number;
}
