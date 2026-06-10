import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, RateLimitError } from 'bullmq';
import { Repository } from 'typeorm';
import {
  NOTIFICATION_QUEUE,
  NotificationJobName,
  SendEmailJobData,
  SendTelegramJobData,
} from '../notifications.queue';
import { Notification, NotificationStatus } from '../entities/notification.entity';
import { MailService } from '../mail/mail.service';
import { TelegramRateLimitError, TelegramService } from '../../telegram/telegram.service';

@Processor(NOTIFICATION_QUEUE)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
    private readonly mail: MailService,
    private readonly telegram: TelegramService,
  ) {
    super();
  }

  async process(job: Job<SendEmailJobData | SendTelegramJobData>): Promise<void> {
    const notif = await this.notifRepo.findOne({
      where: { id: job.data.notificationId },
    });

    if (!notif) {
      this.logger.warn(`Notification ${job.data.notificationId} not found — skipping`);
      return;
    }

    notif.attemptCount += 1;
    notif.lastAttemptAt = new Date();
    await this.notifRepo.save(notif);

    try {
      if (job.name === NotificationJobName.SEND_EMAIL) {
        const d = job.data as SendEmailJobData;
        await this.mail.sendMail({ to: d.to, subject: d.subject, html: d.html, text: d.text });
      } else if (job.name === NotificationJobName.SEND_TELEGRAM) {
        const d = job.data as SendTelegramJobData;
        await this.telegram.sendMessage(d.text);
      }

      notif.status = NotificationStatus.SENT;
      notif.sentAt = new Date();
      notif.errorMessage = null;
      await this.notifRepo.save(notif);

      this.logger.log(
        `[${job.name}] Delivered → ${notif.recipient} (attempt ${notif.attemptCount})`,
      );
    } catch (err) {
      if (err instanceof TelegramRateLimitError) {
        // Rate limits aren't delivery failures — undo the attempt charge, pause the
        // worker, and let BullMQ redeliver the job without burning a retry.
        notif.attemptCount -= 1;
        await this.notifRepo.save(notif);

        this.logger.warn(
          `[${job.name}] Rate limited → ${notif.recipient}: ${err.message}`,
        );
        await this.worker.rateLimit(err.retryAfterMs);
        throw new RateLimitError();
      }

      const message = (err as Error).message;
      const isFinalAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
      notif.status = isFinalAttempt ? NotificationStatus.FAILED : NotificationStatus.PENDING;
      notif.errorMessage = message;
      await this.notifRepo.save(notif);

      this.logger.error(
        `[${job.name}] Failed → ${notif.recipient} (attempt ${notif.attemptCount}/${job.opts.attempts ?? 1}): ${message}`,
      );
      throw err; // re-throw so BullMQ schedules the next retry
    }
  }
}
