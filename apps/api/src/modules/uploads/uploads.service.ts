import { Injectable, BadRequestException } from '@nestjs/common';
import { extname } from 'path';
import { StorageService } from '../storage/storage.service';
import { UploadResponseDto } from './dto/upload-response.dto';
import { PresignedUrlResponseDto } from './dto/presigned-url-response.dto';
import { ConfirmUploadResponseDto } from './dto/confirm-upload-response.dto';

const PRESIGNED_URL_EXPIRES_IN = 300; // 5 minutes
const ALLOWED_MIME_TYPES = /^image\/(jpeg|jpg|png|webp|gif)$/;

// Magic-byte signatures for the allowed image types. The client-supplied
// `mimetype` comes from the request's Content-Type header and can be
// spoofed, so the actual file bytes are checked against it.
const SIGNATURE_CHECKS: Record<string, (buf: Buffer) => boolean> = {
  'image/jpeg': (buf) => buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff,
  'image/jpg': (buf) => buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff,
  'image/png': (buf) =>
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a,
  'image/gif': (buf) =>
    buf.length >= 6 &&
    buf[0] === 0x47 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x38 &&
    (buf[4] === 0x37 || buf[4] === 0x39) &&
    buf[5] === 0x61,
  'image/webp': (buf) =>
    buf.length >= 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP',
};

// Acceptable filename extensions for each presigned-upload contentType.
// Used as a sanity check that the client's declared filename matches what
// it says it's uploading (defense-in-depth; storage keys never use this
// extension — they're always derived from the validated contentType).
const EXTENSIONS_BY_CONTENT_TYPE: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/jpg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
  'application/pdf': ['.pdf'],
};

@Injectable()
export class UploadsService {
  constructor(private readonly storage: StorageService) {}

  private validateImage(file: Express.Multer.File): void {
    if (!file.size) {
      throw new BadRequestException(`File "${file.originalname}" is empty`);
    }
    if (!ALLOWED_MIME_TYPES.test(file.mimetype)) {
      throw new BadRequestException(`File "${file.originalname}" is not an allowed image type`);
    }
    const checkSignature = SIGNATURE_CHECKS[file.mimetype.toLowerCase()];
    if (!checkSignature?.(file.buffer)) {
      throw new BadRequestException(
        `File "${file.originalname}" content does not match its declared type`,
      );
    }
  }

  async uploadSingle(
    file: Express.Multer.File,
    folder = 'images',
    createdBy?: string | null,
  ): Promise<UploadResponseDto> {
    this.validateImage(file);
    return this.storage.upload(file, folder, createdBy);
  }

  async uploadMany(
    files: Express.Multer.File[],
    folder = 'images',
    createdBy?: string | null,
  ): Promise<UploadResponseDto[]> {
    for (const file of files) {
      this.validateImage(file);
    }

    // Upload sequentially and roll back any files already written to storage
    // if a later one fails, so a partial failure doesn't leave confirmed but
    // unreferenced ("orphan") objects behind.
    const uploaded: UploadResponseDto[] = [];
    try {
      for (const file of files) {
        uploaded.push(await this.storage.upload(file, folder, createdBy));
      }
    } catch (err) {
      await Promise.allSettled(uploaded.map((u) => this.storage.delete(u.key)));
      throw err;
    }
    return uploaded;
  }

  async delete(key: string): Promise<void> {
    return this.storage.delete(key);
  }

  async getPresignedUploadUrl(
    contentType: string,
    filename: string,
    folder = 'images',
    contentLength: number,
    createdBy?: string | null,
  ): Promise<PresignedUrlResponseDto> {
    const ext = extname(filename).toLowerCase();
    const allowedExtensions = EXTENSIONS_BY_CONTENT_TYPE[contentType.toLowerCase()];
    if (!allowedExtensions?.includes(ext)) {
      throw new BadRequestException(
        `File extension "${ext || '(none)'}" does not match contentType "${contentType}"`,
      );
    }

    const result = await this.storage.getPresignedUploadUrl(folder, contentType, PRESIGNED_URL_EXPIRES_IN, {
      contentLength,
      createdBy,
    });
    return { ...result, expiresIn: PRESIGNED_URL_EXPIRES_IN };
  }

  async confirmUpload(key: string, requestedBy?: string | null): Promise<ConfirmUploadResponseDto> {
    return this.storage.confirmUpload(key, requestedBy);
  }
}
