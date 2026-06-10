import { Injectable } from '@nestjs/common';
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { StorageService } from '../../storage/storage.service';

@Injectable()
export class StorageHealthIndicator extends HealthIndicator {
  constructor(private readonly storage: StorageService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.storage.ping();
      return this.getStatus(key, true);
    } catch (error) {
      throw new HealthCheckError(
        'Storage health check failed',
        this.getStatus(key, false, { message: (error as Error).message }),
      );
    }
  }
}
