import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter!: Transporter;
  private fromAddress!: string;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const host = this.config.get<string>('mail.host');
    const port = this.config.get<number>('mail.port') ?? 587;
    const user = this.config.get<string>('mail.user');
    const pass = this.config.get<string>('mail.pass');
    this.fromAddress = this.config.get<string>('mail.from') ?? 'noreply@apple-plus.com';

    if (!host || !user || !pass) {
      this.logger.warn('Mail credentials not configured — emails will be logged only');
      this.transporter = nodemailer.createTransport({ jsonTransport: true });
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      // Prevent indefinite hangs under slow/unresponsive SMTP servers
      connectionTimeout: 10_000,
      greetingTimeout: 5_000,
      socketTimeout: 30_000,
    });

    this.logger.log(`Mail transport ready → ${host}:${port}`);
  }

  async sendMail(options: SendMailOptions): Promise<void> {
    const to = Array.isArray(options.to) ? options.to.join(', ') : options.to;

    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject: options.subject,
        html: options.html,
        text: options.text ?? options.subject,
      });

      this.logger.log(`Email sent to ${to} | subject: "${options.subject}" | id: ${info.messageId}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${(err as Error).message}`);
      throw err;
    }
  }
}
