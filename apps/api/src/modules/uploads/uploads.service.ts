import { Injectable, BadRequestException } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { UploadResponseDto } from './dto/upload-response.dto';
import { PresignedUrlResponseDto } from './dto/presigned-url-response.dto';

const PRESIGNED_URL_EXPIRES_IN = 300; // 5 minutes
const ALLOWED_MIME_TYPES = /^image\/(jpeg|jpg|png|webp|gif)$/;

@Injectable()
export class UploadsService {
  constructor(private readonly storage: StorageService) {}

  async uploadSingle(file: Express.Multer.File, folder = 'images'): Promise<UploadResponseDto> {
    if (!ALLOWED_MIME_TYPES.test(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, WebP and GIF images are allowed');
    }
    return this.storage.upload(file, folder);
  }

  async uploadMany(files: Express.Multer.File[], folder = 'images'): Promise<UploadResponseDto[]> {
    for (const file of files) {
      if (!ALLOWED_MIME_TYPES.test(file.mimetype)) {
        throw new BadRequestException(`File "${file.originalname}" is not an allowed image type`);
      }
    }
    return Promise.all(files.map((f) => this.storage.upload(f, folder)));
  }

  async delete(key: string): Promise<void> {
    return this.storage.delete(key);
  }

  async getPresignedUploadUrl(
    filename: string,
    contentType: string,
    folder = 'images',
  ): Promise<PresignedUrlResponseDto> {
    const result = await this.storage.getPresignedUploadUrl(
      folder,
      filename,
      contentType,
      PRESIGNED_URL_EXPIRES_IN,
    );
    return { ...result, expiresIn: PRESIGNED_URL_EXPIRES_IN };
  }
}
