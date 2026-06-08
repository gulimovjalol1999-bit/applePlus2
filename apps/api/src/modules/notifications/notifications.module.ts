import { Module } from '@nestjs/common';
import { TelegramModule } from '../telegram/telegram.module';
import { MailService } from './mail/mail.service';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [TelegramModule],
  providers: [MailService, NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
