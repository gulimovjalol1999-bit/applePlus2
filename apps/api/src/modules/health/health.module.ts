import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { StorageModule } from '../storage/storage.module';
import { HealthController } from './health.controller';
import { RedisHealthIndicator } from './indicators/redis.health';
import { StorageHealthIndicator } from './indicators/storage.health';

@Module({
  imports: [
    TerminusModule.forRoot({
      // Structured JSON logs integrate better with log aggregators (Loki, CloudWatch).
      errorLogStyle: 'json',
    }),
    StorageModule,
  ],
  controllers: [HealthController],
  providers: [RedisHealthIndicator, StorageHealthIndicator],
})
export class HealthModule {}
