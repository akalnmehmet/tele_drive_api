import nodemailer from 'nodemailer';
import { env } from '../../config/env';
import { logger } from './logger';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
});

export interface MailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; path: string }[];
}

export async function sendMail(options: MailOptions): Promise<void> {
  try {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    });
    logger.info('E-posta gönderildi', { to: options.to, subject: options.subject });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('E-posta gönderme hatası', { to: options.to, error: message });
    // Hata fırlatmıyoruz — mail hatası kritik iş akışını durdurmamalı
  }
}
