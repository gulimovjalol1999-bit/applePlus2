import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationChannel,
  NotificationStatus,
  NotificationType,
} from './entities/notification.entity';
import {
  NOTIFICATION_QUEUE,
  NOTIFICATION_JOB_OPTS,
  NotificationJobName,
  SendEmailJobData,
  SendTelegramJobData,
} from './notifications.queue';
import {
  OrderConfirmedEvent,
  OrderStatusUpdatedEvent,
  WelcomeEmailEvent,
} from './events/notification.events';
import {
  orderConfirmationTemplate,
  orderStatusTemplate,
  passwordResetTemplate,
  welcomeTemplate,
} from './mail/email-templates';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectQueue(NOTIFICATION_QUEUE) private readonly queue: Queue,
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
  ) {}

  // ── Event listeners ─────────────────────────────────────────────────────────

  @OnEvent('user.registered', { async: true })
  async onUserRegistered(event: WelcomeEmailEvent): Promise<void> {
    await this.enqueueEmail({
      idempotencyKey: `welcome:${event.userId}:email`,
      type: NotificationType.WELCOME,
      recipient: event.email,
      data: {
        to: event.email,
        subject: `Welcome to Apple Plus, ${event.firstName}!`,
        html: welcomeTemplate(event.firstName),
        text: `Welcome ${event.firstName}! Your Apple Plus account is ready.`,
      },
    });
  }

  @OnEvent('order.confirmed', { async: true })
  async onOrderConfirmed(event: OrderConfirmedEvent): Promise<void> {
    const baseKey = `order_confirmation:${event.orderId}`;
    await Promise.all([
      this.enqueueEmail({
        idempotencyKey: `${baseKey}:email`,
        type: NotificationType.ORDER_CONFIRMATION,
        recipient: event.email,
        data: {
          to: event.email,
          subject: `Order Confirmed — #${event.orderNumber}`,
          html: orderConfirmationTemplate({
            firstName: event.firstName,
            orderNumber: event.orderNumber,
            items: event.items,
            subtotal: event.subtotal,
            total: event.total,
            shippingAddress: event.shippingAddress,
          }),
          text: `Order #${event.orderNumber} confirmed. Total: $${event.total.toFixed(2)}`,
        },
      }),
      this.enqueueTelegram({
        idempotencyKey: `${baseKey}:telegram`,
        type: NotificationType.ORDER_CONFIRMATION,
        text: `Order confirmed: #${event.orderNumber} — $${event.total.toFixed(2)} (${event.items.length} item${event.items.length !== 1 ? 's' : ''})`,
      }),
    ]);
  }

  @OnEvent('order.status_updated', { async: true })
  async onOrderStatusUpdated(event: OrderStatusUpdatedEvent): Promise<void> {
    const baseKey = `order_status:${event.orderId}:${event.status}`;
    await Promise.all([
      this.enqueueEmail({
        idempotencyKey: `${baseKey}:email`,
        type: NotificationType.ORDER_STATUS_UPDATE,
        recipient: event.email,
        data: {
          to: event.email,
          subject: `Order #${event.orderNumber} — ${event.status}`,
          html: orderStatusTemplate({
            firstName: event.firstName,
            orderNumber: event.orderNumber,
            status: event.status,
            statusMessage: event.statusMessage,
          }),
          text: `Your order #${event.orderNumber} status: ${event.status}. ${event.statusMessage}`,
        },
      }),
      this.enqueueTelegram({
        idempotencyKey: `${baseKey}:telegram`,
        type: NotificationType.ORDER_STATUS_UPDATE,
        text: `Order #${event.orderNumber} → ${event.status}: ${event.statusMessage}`,
      }),
    ]);
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  /** Password reset is a direct call (no event) — token itself is the idempotency key. */
  async sendPasswordReset(params: {
    to: string;
    firstName: string;
    resetUrl: string;
    resetToken: string;
    expiresInMinutes?: number;
  }): Promise<void> {
    await this.enqueueEmail({
      idempotencyKey: `password_reset:${params.resetToken}:email`,
      type: NotificationType.PASSWORD_RESET,
      recipient: params.to,
      data: {
        to: params.to,
        subject: 'Reset Your Apple Plus Password',
        html: passwordResetTemplate({
          firstName: params.firstName,
          resetUrl: params.resetUrl,
          expiresInMinutes: params.expiresInMinutes ?? 30,
        }),
        text: `Reset your password: ${params.resetUrl} (expires in ${params.expiresInMinutes ?? 30} min)`,
      },
    });
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private async enqueueEmail(opts: {
    idempotencyKey: string;
    type: NotificationType;
    recipient: string;
    data: Omit<SendEmailJobData, 'notificationId'>;
  }): Promise<void> {
    const notif = await this.getOrCreate({
      idempotencyKey: opts.idempotencyKey,
      type: opts.type,
      channel: NotificationChannel.EMAIL,
      recipient: opts.recipient,
      payload: opts.data as Record<string, unknown>,
    });
    if (!notif) return;

    await this.queue.add(
      NotificationJobName.SEND_EMAIL,
      { notificationId: notif.id, ...opts.data } satisfies SendEmailJobData,
      { ...NOTIFICATION_JOB_OPTS, jobId: notif.id },
    );
    this.logger.debug(`Enqueued email → ${opts.recipient} [${opts.idempotencyKey}]`);
  }

  private async enqueueTelegram(opts: {
    idempotencyKey: string;
    type: NotificationType;
    text: string;
  }): Promise<void> {
    const notif = await this.getOrCreate({
      idempotencyKey: opts.idempotencyKey,
      type: opts.type,
      channel: NotificationChannel.TELEGRAM,
      recipient: 'telegram',
      payload: { text: opts.text },
    });
    if (!notif) return;

    await this.queue.add(
      NotificationJobName.SEND_TELEGRAM,
      { notificationId: notif.id, text: opts.text } satisfies SendTelegramJobData,
      { ...NOTIFICATION_JOB_OPTS, jobId: notif.id },
    );
  }

  /**
   * Finds or creates a Notification record for idempotency.
   * Returns null if the notification was already successfully delivered → skip enqueue.
   */
  private async getOrCreate(opts: {
    idempotencyKey: string;
    type: NotificationType;
    channel: NotificationChannel;
    recipient: string;
    payload: Record<string, unknown>;
  }): Promise<Notification | null> {
    const existing = await this.notifRepo.findOne({
      where: { idempotencyKey: opts.idempotencyKey },
    });

    if (existing) {
      if (existing.status === NotificationStatus.SENT) {
        this.logger.debug(`Duplicate skipped (already sent): ${opts.idempotencyKey}`);
        return null;
      }
      return existing; // PENDING or FAILED → allow re-queue
    }

    return this.notifRepo.save(
      this.notifRepo.create({
        idempotencyKey: opts.idempotencyKey,
        type: opts.type,
        channel: opts.channel,
        recipient: opts.recipient,
        status: NotificationStatus.PENDING,
        payload: opts.payload,
        attemptCount: 0,
        lastAttemptAt: null,
        sentAt: null,
        errorMessage: null,
      }),
    );
  }
}
