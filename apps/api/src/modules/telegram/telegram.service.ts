import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';

const TELEGRAM_TIMEOUT_MS = 10_000;
const DEFAULT_RETRY_AFTER_MS = 5_000;

/** Thrown when Telegram responds with 429 — caller should pause delivery for `retryAfterMs`. */
export class TelegramRateLimitError extends Error {
  constructor(
    message: string,
    public readonly retryAfterMs: number,
  ) {
    super(message);
    this.name = 'TelegramRateLimitError';
  }
}

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(private readonly config: ConfigService) {}

  /** Sends a plain-text message to every configured Telegram chat/channel. */
  async sendMessage(text: string): Promise<void> {
    const token = this.config.get<string>('telegram.botToken');
    const chatIds = this.config.get<string[]>('telegram.chatIds') ?? [];

    if (!token || chatIds.length === 0) {
      this.logger.warn('Telegram not configured — skipping notification');
      return;
    }

    await Promise.all(chatIds.map((chatId) => this.sendToChat(token, chatId, text)));
  }

  private sendToChat(token: string, chatId: string, text: string): Promise<void> {
    const payload = JSON.stringify({ chat_id: chatId, text });

    return new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: 'api.telegram.org',
          path: `/bot${token}/sendMessage`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
          },
          timeout: TELEGRAM_TIMEOUT_MS,
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => {
            const body = Buffer.concat(chunks).toString('utf8');
            const statusCode = res.statusCode ?? 0;

            if (statusCode >= 200 && statusCode < 300) {
              resolve();
              return;
            }

            let description = body;
            let retryAfterSeconds: number | undefined;
            try {
              const parsed = JSON.parse(body) as {
                description?: string;
                parameters?: { retry_after?: number };
              };
              if (parsed.description) description = parsed.description;
              retryAfterSeconds = parsed.parameters?.retry_after;
            } catch {
              // body wasn't JSON — fall back to raw text
            }

            const message = `Telegram API error (status ${statusCode}, chat ${chatId}): ${description}`;

            if (statusCode === 429) {
              const retryAfterMs = (retryAfterSeconds ?? DEFAULT_RETRY_AFTER_MS / 1000) * 1000;
              this.logger.warn(`${message} — retry after ${retryAfterMs}ms`);
              reject(new TelegramRateLimitError(message, retryAfterMs));
              return;
            }

            this.logger.error(message);
            reject(new Error(message));
          });
        },
      );

      req.on('timeout', () => {
        req.destroy(new Error(`Telegram request timed out after ${TELEGRAM_TIMEOUT_MS}ms`));
      });

      req.on('error', (err) => {
        this.logger.error(`Telegram send failed (chat ${chatId}): ${err.message}`);
        reject(err);
      });

      req.write(payload);
      req.end();
    });
  }
}
