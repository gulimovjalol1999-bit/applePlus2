import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageService } from './storage.service';
import { StorageObject } from './entities/storage-object.entity';
import { StorageCleanupProcessor } from './processors/storage-cleanup.processor';
import { STORAGE_CLEANUP_QUEUE } from './storage.queue';

@Module({
  imports: [TypeOrmModule.forFeature([StorageObject]), BullModule.registerQueue({ name: STORAGE_CLEANUP_QUEUE })],
  providers: [StorageService, StorageCleanupProcessor],
  exports: [StorageService],
})
export class StorageModule {}
