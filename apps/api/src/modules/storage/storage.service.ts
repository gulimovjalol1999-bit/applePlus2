import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import * as path from 'path';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private readonly config: ConfigService) {
    const endpoint = config.get<string>('storage.endpoint');
    const port = config.get<number>('storage.port');
    const useSsl = config.get<boolean>('storage.useSsl');
    this.bucket = config.get<string>('storage.bucket') ?? 'apple-plus';

    const protocol = useSsl ? 'https' : 'http';
    const endpointUrl = `${protocol}://${endpoint}:${port}`;
    this.publicUrl = endpointUrl;

    this.client = new S3Client({
      endpoint: endpointUrl,
      region: 'us-east-1',
      credentials: {
        accessKeyId: config.get<string>('storage.accessKey') ?? 'minioadmin',
        secretAccessKey: config.get<string>('storage.secretKey') ?? 'minioadmin',
      },
      forcePathStyle: true,
    });
  }

  async onModuleInit() {
    await this.ensureBucketExists();
  }

  private async ensureBucketExists() {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
        this.logger.log(`Bucket "${this.bucket}" created`);
      } catch (err) {
        this.logger.warn(`Could not create bucket "${this.bucket}" — MinIO may not be running yet: ${(err as Error).message}`);
      }
    }
  }

  async upload(
    file: Express.Multer.File,
    folder = 'uploads',
  ): Promise<{ url: string; key: string }> {
    const ext = path.extname(file.originalname).toLowerCase();
    const key = `${folder}/${randomUUID()}${ext}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentLength: file.size,
      }),
    );

    return { url: `${this.publicUrl}/${this.bucket}/${key}`, key };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  async getPresignedUploadUrl(
    folder: string,
    originalName: string,
    contentType: string,
    expiresIn = 300,
  ): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
    const ext = path.extname(originalName).toLowerCase();
    const key = `${folder}/${randomUUID()}${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn });
    const publicUrl = `${this.publicUrl}/${this.bucket}/${key}`;

    return { uploadUrl, key, publicUrl };
  }
}
