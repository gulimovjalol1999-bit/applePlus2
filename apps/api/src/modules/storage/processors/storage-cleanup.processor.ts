import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { StorageService } from '../storage.service';
import { STORAGE_CLEANUP_QUEUE } from '../storage.queue';

/**
 * Periodically removes PENDING storage_objects rows whose presigned URL was
 * never used (and never confirmed), so reserved-but-unused uploads don't
 * accumulate forever.
 */
@Processor(STORAGE_CLEANUP_QUEUE)
export class StorageCleanupProcessor extends WorkerHost {
  private readonly logger = new Logger(StorageCleanupProcessor.name);

  constructor(private readonly storage: StorageService) {
    super();
  }

  async process(_job: Job): Promise<void> {
    const removed = await this.storage.cleanupStalePendingUploads();
    if (removed > 0) {
      this.logger.log(`Cleaned up ${removed} stale PENDING storage object(s)`);
    }
  }
}
