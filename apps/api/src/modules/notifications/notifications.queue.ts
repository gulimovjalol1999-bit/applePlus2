export const NOTIFICATION_QUEUE = 'notifications';

export enum NotificationJobName {
  SEND_EMAIL = 'send_email',
  SEND_TELEGRAM = 'send_telegram',
}

export interface SendEmailJobData {
  notificationId: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendTelegramJobData {
  notificationId: string;
  text: string;
}

/** 3 attempts with exponential backoff: ~1 min → ~2 min → ~4 min. */
export const NOTIFICATION_JOB_OPTS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 60_000 },
  removeOnComplete: { age: 86_400 },      // keep completed jobs 24 h for debugging
  removeOnFail: { age: 7 * 86_400 },      // keep failed jobs 7 days for audit
} as const;
