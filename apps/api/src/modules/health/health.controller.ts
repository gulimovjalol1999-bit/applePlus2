import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { RedisHealthIndicator } from './indicators/redis.health';
import { StorageHealthIndicator } from './indicators/storage.health';

const DB_TIMEOUT_MS = 3_000;
const DISK_THRESHOLD = 0.9;
const MEMORY_HEAP_BYTES = 512 * 1024 * 1024;

@ApiTags('health')
@Controller('health')
@SkipThrottle()
export class HealthController {
  private readonly diskPath: string;

  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly redisHealth: RedisHealthIndicator,
    private readonly storageHealth: StorageHealthIndicator,
    config: ConfigService,
  ) {
    // Read once at startup — avoids per-request config lookup.
    this.diskPath = config.get<string>('app.healthDiskPath', '/');
  }

  /** Liveness probe — process is running (Docker HEALTHCHECK / K8s livenessProbe) */
  @Get('live')
  @ApiOperation({ summary: 'Liveness probe — process is alive' })
  @ApiOkResponse({ description: 'Process is alive' })
  live(): { status: string; timestamp: string } {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  /** Readiness probe — all dependencies healthy (K8s readinessProbe) */
  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe — checks DB, Redis, Storage, disk, memory' })
  @ApiOkResponse({ description: 'All dependencies are healthy' })
  @ApiServiceUnavailableResponse({ description: 'One or more dependencies are unhealthy' })
  ready() {
    return this.health.check([
      () => this.db.pingCheck('database', { timeout: DB_TIMEOUT_MS }),
      () => this.redisHealth.isHealthy('redis'),
      () => this.storageHealth.isHealthy('storage'),
      () => this.memory.checkHeap('memory_heap', MEMORY_HEAP_BYTES),
      () => this.disk.checkStorage('disk', { path: this.diskPath, thresholdPercent: DISK_THRESHOLD }),
    ]);
  }

  /** Startup probe — lightweight DB check only (K8s startupProbe) */
  @Get('startup')
  @HealthCheck()
  @ApiOperation({ summary: 'Startup probe — checks DB connectivity only' })
  @ApiOkResponse({ description: 'Application has started successfully' })
  @ApiServiceUnavailableResponse({ description: 'Application not yet ready' })
  startup() {
    return this.health.check([
      () => this.db.pingCheck('database', { timeout: DB_TIMEOUT_MS }),
    ]);
  }

  /**
   * @deprecated Use /health/ready instead.
   * Kept for backwards compatibility — behaves identically to /ready.
   */
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Full health check (deprecated — use /health/ready)' })
  @ApiOkResponse({ description: 'All dependencies are healthy' })
  @ApiServiceUnavailableResponse({ description: 'One or more dependencies are unhealthy' })
  check() {
    return this.health.check([
      () => this.db.pingCheck('database', { timeout: DB_TIMEOUT_MS }),
      () => this.redisHealth.isHealthy('redis'),
      () => this.storageHealth.isHealthy('storage'),
    ]);
  }
}
