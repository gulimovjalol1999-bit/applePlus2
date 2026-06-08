import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.client = new Redis({
      host: this.config.get<string>('redis.host', 'localhost'),
      port: this.config.get<number>('redis.port', 6379),
      password: this.config.get<string>('redis.password') || undefined,
      maxRetriesPerRequest: null,
      retryStrategy: (times) => Math.min(times * 500, 10_000),
    });

    this.client.on('connect', () => this.logger.log('Redis connected'));
    this.client.on('error', (err) => this.logger.error('Redis error', err.message));
  }

  onModuleDestroy() {
    this.client.disconnect();
  }

  // ── Token blacklist ──────────────────────────────────────────────────────

  /** Logout bo'lgan access token-ni TTL (sekund) bilan qora ro'yxatga qo'shish */
  async blacklistToken(jti: string, ttlSeconds: number): Promise<void> {
    await this.client.setex(`bl:${jti}`, ttlSeconds, '1');
  }

  async isTokenBlacklisted(jti: string): Promise<boolean> {
    const val = await this.client.get(`bl:${jti}`);
    return val !== null;
  }

  // ── Kesh (cache) ─────────────────────────────────────────────────────────

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  }

  async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    await this.client.setex(key, ttlSeconds, JSON.stringify(value));
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /** Pattern bo'yicha bir nechta kalitlarni o'chirish, masalan: "products:*" */
  async delByPattern(pattern: string): Promise<void> {
    const keys = await this.client.keys(pattern);
    if (keys.length) await this.client.del(...keys);
  }
}
