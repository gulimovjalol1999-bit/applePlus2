import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum NotificationChannel {
  EMAIL = 'email',
  TELEGRAM = 'telegram',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}

export enum NotificationType {
  WELCOME = 'welcome',
  ORDER_CONFIRMATION = 'order_confirmation',
  ORDER_STATUS_UPDATE = 'order_status_update',
  PASSWORD_RESET = 'password_reset',
}

@Entity('notifications')
@Index('idx_notifications_recipient', ['recipient'])
@Index('idx_notifications_status', ['status'])
@Index('idx_notifications_created_at', ['createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  type: NotificationType;

  @Column({ type: 'varchar', length: 50 })
  channel: NotificationChannel;

  @Column({ type: 'varchar', length: 255 })
  recipient: string;

  /** Prevents duplicate delivery: unique per (type, channel, business-entity-id). */
  @Column({ type: 'varchar', length: 255, unique: true })
  idempotencyKey: string;

  @Column({ type: 'varchar', length: 20, default: NotificationStatus.PENDING })
  status: NotificationStatus;

  @Column({ type: 'jsonb', nullable: true })
  payload: Record<string, unknown> | null;

  @Column({ type: 'int', default: 0 })
  attemptCount: number;

  @Column({ type: 'timestamptz', nullable: true })
  lastAttemptAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  sentAt: Date | null;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
