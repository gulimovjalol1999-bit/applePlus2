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

  /**
   * Pattern bo'yicha kalitlarni o'chirish.
   * SCAN + cursor bilan ishlaydi — KEYS dan farqli o'laroq Redis event loop'ni
   * bloklamaydi va millionlab kalitli production dataset'da xavfsiz.
   */
  async delByPattern(pattern: string): Promise<void> {
    let cursor = '0';
    do {
      const [next, keys] = await this.client.scan(
        cursor,
        'MATCH', pattern,
        'COUNT', 200,
      );
      cursor = next;
      if (keys.length > 0) {
        // Bitta DEL buyrug'i — round-trip minimallashtirilgan
        await this.client.del(...(keys as [string, ...string[]]));
      }
    } while (cursor !== '0');
  }

  // ── Health check ──────────────────────────────────────────────────────────

  async ping(): Promise<void> {
    const result = await this.client.ping();
    if (result !== 'PONG') throw new Error(`Unexpected Redis PING response: ${result}`);
  }
}
