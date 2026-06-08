import { Injectable } from '@nestjs/common';
import { MailService } from './mail/mail.service';
import { TelegramService } from '../telegram/telegram.service';
import {
  welcomeTemplate,
  orderConfirmationTemplate,
  orderStatusTemplate,
  passwordResetTemplate,
} from './mail/email-templates';

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly mail: MailService,
    private readonly telegram: TelegramService,
  ) {}

  async sendWelcomeEmail(to: string, firstName: string): Promise<void> {
    await this.mail.sendMail({
      to,
      subject: `Welcome to Apple Plus, ${firstName}!`,
      html: welcomeTemplate(firstName),
      text: `Welcome ${firstName}! Your Apple Plus account is ready.`,
    });
  }

  async sendOrderConfirmation(params: {
    to: string;
    firstName: string;
    orderNumber: string;
    items: OrderItem[];
    subtotal: number;
    total: number;
    shippingAddress: string;
  }): Promise<void> {
    await Promise.all([
      this.mail.sendMail({
        to: params.to,
        subject: `Order Confirmed — #${params.orderNumber}`,
        html: orderConfirmationTemplate(params),
        text: `Order #${params.orderNumber} confirmed. Total: $${params.total.toFixed(2)}`,
      }),
      this.telegram.sendMessage(
        `Order confirmed: #${params.orderNumber} — $${params.total.toFixed(2)} (${params.items.length} item${params.items.length > 1 ? 's' : ''})`,
      ),
    ]);
  }

  async sendOrderStatusUpdate(params: {
    to: string;
    firstName: string;
    orderNumber: string;
    status: string;
    statusMessage: string;
  }): Promise<void> {
    await Promise.all([
      this.mail.sendMail({
        to: params.to,
        subject: `Order #${params.orderNumber} — ${params.status}`,
        html: orderStatusTemplate(params),
        text: `Your order #${params.orderNumber} status: ${params.status}. ${params.statusMessage}`,
      }),
      this.telegram.sendMessage(
        `Order #${params.orderNumber} → ${params.status}: ${params.statusMessage}`,
      ),
    ]);
  }

  async sendPasswordReset(params: {
    to: string;
    firstName: string;
    resetUrl: string;
    expiresInMinutes?: number;
  }): Promise<void> {
    await this.mail.sendMail({
      to: params.to,
      subject: 'Reset Your Apple Plus Password',
      html: passwordResetTemplate({
        firstName: params.firstName,
        resetUrl: params.resetUrl,
        expiresInMinutes: params.expiresInMinutes ?? 30,
      }),
      text: `Reset your password: ${params.resetUrl} (expires in ${params.expiresInMinutes ?? 30} min)`,
    });
  }
}
