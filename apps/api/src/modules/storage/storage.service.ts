import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Queue } from 'bullmq';
import {
  S3Client,
  PutObjectCommand,
  type PutObjectCommandInput,
  GetObjectCommand,
  DeleteObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  type HeadObjectCommandOutput,
  PutBucketPolicyCommand,
  NotFound,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { StorageObject } from './entities/storage-object.entity';
import { StorageObjectStatus } from '../../common/enums/storage-object-status.enum';
import {
  STORAGE_CLEANUP_INTERVAL_MS,
  STORAGE_CLEANUP_JOB,
  STORAGE_CLEANUP_QUEUE,
  STORAGE_PENDING_TTL_MS,
} from './storage.queue';

// Extensions are derived from the validated MIME type rather than the
// client-supplied filename, so a spoofed filename (e.g. "x.php") cannot
// change the stored object's extension.
const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
};

// Magic-byte signatures used to verify that a file uploaded via a presigned
// URL actually matches the content type it was reserved for. The presigned
// PUT goes straight to MinIO/S3, so this is the only point where the API
// ever sees the real file bytes.
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
    buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP',
  'application/pdf': (buf) => buf.length >= 5 && buf.toString('ascii', 0, 5) === '%PDF-',
};

// Only these folders are exposed via the bucket's public-read policy.
// Anything else (e.g. "documents") stays private — never add a folder here
// that may hold non-public files.
const PUBLIC_READ_FOLDERS = ['images', 'avatars'];

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;
  /** True once the scoped public-read policy has been applied to the bucket. */
  private policyApplied = false;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(StorageObject)
    private readonly storageObjects: Repository<StorageObject>,
    @InjectQueue(STORAGE_CLEANUP_QUEUE)
    private readonly cleanupQueue: Queue,
  ) {
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
    await this.ensureBucketExistsWithRetry();
    await this.cleanupQueue.upsertJobScheduler(
      STORAGE_CLEANUP_JOB,
      { every: STORAGE_CLEANUP_INTERVAL_MS },
      { name: STORAGE_CLEANUP_JOB },
    );
  }

  // MinIO is often started in parallel with the API container and may not
  // accept connections yet, so retry with backoff a few times before giving
  // up (the app still boots either way — uploads will just fail until MinIO
  // is reachable).
  private async ensureBucketExistsWithRetry(maxAttempts = 5) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const ready = await this.ensureBucketExists();
      if (ready) return;
      if (attempt < maxAttempts) {
        const delayMs = Math.min(1000 * 2 ** (attempt - 1), 10_000);
        this.logger.warn(
          `Storage not ready (attempt ${attempt}/${maxAttempts}), retrying in ${delayMs}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    this.logger.warn(
      `Could not initialize bucket "${this.bucket}" after ${maxAttempts} attempts — uploads will fail until MinIO is reachable`,
    );
  }

  /** Returns true once the bucket exists and the scoped public-read policy is applied. */
  private async ensureBucketExists(): Promise<boolean> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
        this.logger.log(`Bucket "${this.bucket}" created`);
      } catch (err) {
        this.logger.warn(`Bucket "${this.bucket}" not reachable yet: ${(err as Error).message}`);
        return false;
      }
    }
    this.policyApplied = await this.ensurePublicReadPolicy();
    return this.policyApplied;
  }

  // Product/avatar images are referenced via the public URL returned to
  // clients, so those folders must allow anonymous reads. Every other folder
  // (e.g. "documents") is intentionally left out of the policy and stays
  // private — writes/deletes always require signed credentials regardless.
  private async ensurePublicReadPolicy(): Promise<boolean> {
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: '*',
          Action: ['s3:GetObject'],
          Resource: PUBLIC_READ_FOLDERS.map((folder) => `arn:aws:s3:::${this.bucket}/${folder}/*`),
        },
      ],
    };

    try {
      await this.client.send(
        new PutBucketPolicyCommand({
          Bucket: this.bucket,
          Policy: JSON.stringify(policy),
        }),
      );
      return true;
    } catch (err) {
      const error = err as Error & { name?: string };
      if (error.name === 'AccessDenied') {
        this.logger.error(
          `Could not set public-read policy on bucket "${this.bucket}": access denied. ` +
            `On AWS S3 this usually means "Block Public Access" (BlockPublicPolicy) is enabled for ` +
            `this bucket/account; it must allow bucket policies so that "${PUBLIC_READ_FOLDERS.join('/, ')}/*" ` +
            `objects are publicly readable. Until this is fixed, uploaded image URLs will return 403.`,
        );
      } else {
        this.logger.error(`Could not set public-read policy on bucket "${this.bucket}": ${error.message}`);
      }
      return false;
    }
  }

  /** Returns a safe extension (with leading dot) for a validated MIME type. */
  resolveExtension(mimetype: string): string {
    const ext = MIME_EXTENSIONS[mimetype.toLowerCase()];
    if (!ext) {
      throw new InternalServerErrorException(`Unsupported content type: ${mimetype}`);
    }
    return ext;
  }

  async upload(
    file: Express.Multer.File,
    folder = 'uploads',
    createdBy?: string | null,
  ): Promise<{ url: string; key: string }> {
    const ext = this.resolveExtension(file.mimetype);
    const key = `${folder}/${randomUUID()}${ext}`;

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          ContentLength: file.size,
        }),
      );
    } catch (err) {
      this.logger.error(`Failed to upload object "${key}": ${(err as Error).message}`);
      throw new InternalServerErrorException('Failed to upload file to storage');
    }

    const url = `${this.publicUrl}/${this.bucket}/${key}`;
    await this.recordObject({
      key,
      url,
      folder,
      mimetype: file.mimetype,
      size: file.size,
      status: StorageObjectStatus.CONFIRMED,
      createdBy: createdBy ?? null,
    });

    return { url, key };
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch (err) {
      if (err instanceof NotFound || (err as { name?: string }).name === 'NotFound') {
        throw new NotFoundException(`File "${key}" does not exist`);
      }
      this.logger.error(`Failed to check object "${key}": ${(err as Error).message}`);
      throw new InternalServerErrorException('Failed to access storage');
    }

    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
      );
    } catch (err) {
      this.logger.error(`Failed to delete object "${key}": ${(err as Error).message}`);
      throw new InternalServerErrorException('Failed to delete file from storage');
    }

    // The object is already gone from storage at this point, so retry the DB
    // update a few times — otherwise a transient DB error would leave a row
    // that still looks "live" for a file that no longer exists.
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.storageObjects.softDelete({ key });
        return;
      } catch (err) {
        if (attempt === maxAttempts) {
          this.logger.error(
            `Failed to mark storage object "${key}" as deleted in DB after ${maxAttempts} attempts: ${(err as Error).message}`,
          );
          break;
        }
        this.logger.warn(`Failed to mark storage object "${key}" as deleted in DB (attempt ${attempt}/${maxAttempts}): ${(err as Error).message}`);
        await new Promise((resolve) => setTimeout(resolve, 200 * attempt));
      }
    }
  }

  /** Best-effort tracking record — never blocks the actual storage operation. */
  private async recordObject(data: {
    key: string;
    url: string;
    folder: string;
    mimetype: string;
    size: number | null;
    status: StorageObjectStatus;
    createdBy: string | null;
  }): Promise<void> {
    try {
      await this.storageObjects.save(this.storageObjects.create(data));
    } catch (err) {
      this.logger.warn(`Failed to record storage object "${data.key}" in DB: ${(err as Error).message}`);
    }
  }

  async ping(timeoutMs = 3_000): Promise<void> {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    try {
      await this.client.send(
        new HeadBucketCommand({ Bucket: this.bucket }),
        { abortSignal: ac.signal },
      );
    } catch (err) {
      if (ac.signal.aborted) {
        throw new Error(`MinIO health check timed out after ${timeoutMs}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }

    if (!this.policyApplied) {
      // Re-attempt so a transient failure (or a Block Public Access setting
      // fixed after startup) clears on the next health check.
      this.policyApplied = await this.ensurePublicReadPolicy();
      if (!this.policyApplied) {
        throw new Error(
          `Public-read policy for ${PUBLIC_READ_FOLDERS.join('/, ')}/ is not applied on bucket "${this.bucket}"`,
        );
      }
    }
  }

  async getPresignedUploadUrl(
    folder: string,
    contentType: string,
    expiresIn = 300,
    options: { contentLength: number; createdBy?: string | null },
  ): Promise<{ uploadUrl: string; key: string; publicUrl: string; requiredContentLength: number }> {
    const ext = this.resolveExtension(contentType);
    const key = `${folder}/${randomUUID()}${ext}`;

    // The file size is always signed as part of the request so MinIO/S3
    // rejects an upload whose Content-Length doesn't match — without this,
    // a client could request a presigned URL and PUT an arbitrarily large
    // file directly to storage, bypassing MAX_FILE_SIZE entirely.
    const commandInput: PutObjectCommandInput = {
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      ContentLength: options.contentLength,
    };

    const command = new PutObjectCommand(commandInput);

    let uploadUrl: string;
    try {
      uploadUrl = await getSignedUrl(this.client, command, {
        expiresIn,
        signableHeaders: new Set(['content-length']),
      });
    } catch (err) {
      this.logger.error(`Failed to create presigned URL for "${key}": ${(err as Error).message}`);
      throw new InternalServerErrorException('Failed to create upload URL');
    }
    const publicUrl = `${this.publicUrl}/${this.bucket}/${key}`;

    await this.recordObject({
      key,
      url: publicUrl,
      folder,
      mimetype: contentType,
      size: options.contentLength,
      status: StorageObjectStatus.PENDING,
      createdBy: options.createdBy ?? null,
    });

    return {
      uploadUrl,
      key,
      publicUrl,
      requiredContentLength: options.contentLength,
    };
  }

  /**
   * Confirms that a file reserved via a presigned URL was actually uploaded.
   * Verifies the object exists in storage before marking the DB record CONFIRMED,
   * preventing dangling "pending" rows from masquerading as real files.
   */
  async confirmUpload(
    key: string,
    requestedBy?: string | null,
  ): Promise<{ key: string; url: string; status: StorageObjectStatus }> {
    const record = await this.storageObjects.findOne({ where: { key } });
    if (!record) {
      throw new NotFoundException(`No upload was reserved for key "${key}"`);
    }

    if (record.createdBy && requestedBy && record.createdBy !== requestedBy) {
      throw new ForbiddenException('You cannot confirm an upload reserved by another user');
    }

    if (record.status !== StorageObjectStatus.CONFIRMED) {
      let head: HeadObjectCommandOutput;
      try {
        head = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      } catch (err) {
        if (err instanceof NotFound || (err as { name?: string }).name === 'NotFound') {
          throw new NotFoundException(`File "${key}" was not uploaded to storage`);
        }
        this.logger.error(`Failed to verify object "${key}": ${(err as Error).message}`);
        throw new InternalServerErrorException('Failed to verify uploaded file');
      }

      // The presigned PUT goes straight to MinIO/S3, so this is the first
      // (and only) time the API can inspect the actual file bytes. Reject —
      // and remove — anything whose content doesn't match the content type
      // the upload was reserved for, so a client can't reserve a key as
      // "image/jpeg" and PUT arbitrary content (e.g. HTML/SVG) to it.
      const checkSignature = SIGNATURE_CHECKS[record.mimetype.toLowerCase()];
      if (checkSignature) {
        const prefix = await this.readObjectPrefix(key, 16);
        if (!prefix || !checkSignature(prefix)) {
          await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key })).catch((err) => {
            this.logger.error(`Failed to remove invalid object "${key}": ${(err as Error).message}`);
          });
          await this.storageObjects.remove(record);
          throw new BadRequestException(
            `File "${key}" content does not match its declared type "${record.mimetype}"`,
          );
        }
      }

      record.status = StorageObjectStatus.CONFIRMED;
      if (head.ContentLength != null) {
        record.size = head.ContentLength;
      }
      await this.storageObjects.save(record);
    }

    return { key: record.key, url: record.url, status: record.status };
  }

  /** Reads the first `length` bytes of an object, or `null` if it can't be read. */
  private async readObjectPrefix(key: string, length: number): Promise<Buffer | null> {
    try {
      const result = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key, Range: `bytes=0-${length - 1}` }),
      );
      const bytes = await result.Body?.transformToByteArray();
      return bytes ? Buffer.from(bytes) : null;
    } catch (err) {
      this.logger.error(`Failed to read object "${key}" for content verification: ${(err as Error).message}`);
      return null;
    }
  }

  /**
   * Removes PENDING storage_objects rows whose presigned URL was reserved
   * more than STORAGE_PENDING_TTL_MS ago and never confirmed. The
   * corresponding object (if one was ever uploaded despite never being
   * confirmed) is removed from storage too. Returns the number of rows removed.
   */
  async cleanupStalePendingUploads(): Promise<number> {
    const cutoff = new Date(Date.now() - STORAGE_PENDING_TTL_MS);
    const stale = await this.storageObjects.find({
      where: { status: StorageObjectStatus.PENDING, createdAt: LessThan(cutoff) },
    });

    for (const record of stale) {
      try {
        await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: record.key }));
      } catch (err) {
        if (!(err instanceof NotFound || (err as { name?: string }).name === 'NotFound')) {
          this.logger.warn(`Failed to delete stale pending object "${record.key}": ${(err as Error).message}`);
          continue;
        }
      }
      await this.storageObjects.remove(record);
    }

    return stale.length;
  }
}
