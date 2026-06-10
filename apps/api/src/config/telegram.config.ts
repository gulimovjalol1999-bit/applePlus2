import { registerAs } from '@nestjs/config';

export default registerAs('telegram', () => ({
  botToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
  /** Comma-separated list of chat/channel IDs — supports notifying multiple admins or a channel. */
  chatIds: (process.env.TELEGRAM_CHAT_ID ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0),
}));
