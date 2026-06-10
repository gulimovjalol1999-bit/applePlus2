import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegramModule } from '../telegram/telegram.module';
import { MailService } from './mail/mail.service';
import { NotificationsService } from './notifications.service';
import { NotificationProcessor } from './processors/notification.processor';
import { Notification } from './entities/notification.entity';
import { NOTIFICATION_QUEUE } from './notifications.queue';

@Module({
  imports: [
    TelegramModule,
    TypeOrmModule.forFeature([Notification]),
    BullModule.registerQueue({ name: NOTIFICATION_QUEUE }),
  ],
  providers: [MailService, NotificationsService, NotificationProcessor],
  exports: [NotificationsService],
})
export class NotificationsModule {}
