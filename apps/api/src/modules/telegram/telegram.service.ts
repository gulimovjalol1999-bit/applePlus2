import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';
import { Order } from '../orders/entities/order.entity';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(private readonly config: ConfigService) {}

  async notifyNewOrder(order: Order): Promise<void> {
    const lines: string[] = [
      `🛍 <b>New Order</b> #${order.orderNumber}`,
      '',
    ];

    for (const item of order.items ?? []) {
      const price = (+item.totalPrice).toFixed(2);
      lines.push(`• ${item.productName} × ${item.quantity} — $${price}`);
    }

    lines.push('');
    if (+order.discountAmount > 0) {
      lines.push(`Discount: -$${(+order.discountAmount).toFixed(2)}`);
    }
    if (+order.shippingAmount > 0) {
      lines.push(`Shipping: +$${(+order.shippingAmount).toFixed(2)}`);
    }
    lines.push(`<b>Total: $${(+order.totalAmount).toFixed(2)}</b>`);
    lines.push(`Status: ${order.status.toUpperCase()}`);

    await this.sendMessage(lines.join('\n'));
  }

  async sendMessage(text: string): Promise<void> {
    const token = this.config.get<string>('telegram.botToken');
    const chatId = this.config.get<string>('telegram.chatId');

    if (!token || !chatId) {
      this.logger.warn('Telegram not configured — skipping notification');
      return;
    }

    const payload = JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' });

    return new Promise((resolve) => {
      const req = https.request(
        {
          hostname: 'api.telegram.org',
          path: `/bot${token}/sendMessage`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
          },
        },
        (res) => {
          res.resume();
          res.on('end', resolve);
        },
      );
      req.on('error', (err) => {
        this.logger.error(`Telegram send failed: ${err.message}`);
        resolve();
      });
      req.write(payload);
      req.end();
    });
  }
}
