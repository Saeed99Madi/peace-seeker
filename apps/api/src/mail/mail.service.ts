import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';

export interface MailMessage {
  to: string;
  subject: string;
  body: string;
}

/** RFC 5322 header injection: a newline in a header turns one message into two. */
function assertSingleLine(value: string, field: string): string {
  if (/[\r\n]/.test(value)) {
    throw new Error(`Refusing to send: ${field} contains a line break.`);
  }
  return value;
}

/**
 * Transactional mail. Only three kinds of message exist — a sign-in link, a
 * withdrawal link, and a case notification — each one an action the recipient
 * asked for. There is no marketing path through this service (§3.2).
 */
@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    if (this.config.get<string>('mailTransport') !== 'smtp') return;

    const raw = this.config.get<string>('smtpUrl');
    if (!raw) throw new Error('MAIL_TRANSPORT=smtp requires SMTP_URL.');

    // Parsed rather than handed to nodemailer as a URL string, so that the TLS
    // requirements below are applied explicitly instead of depending on what
    // the connection string happened to specify. A sign-in link intercepted in
    // transit is an account taken over.
    const url = new URL(raw);
    const secure = url.protocol === 'smtps:' || url.port === '465';

    this.transporter = createTransport({
      host: url.hostname,
      port: Number(url.port) || (secure ? 465 : 587),
      secure,
      requireTLS: !secure,
      auth: url.username
        ? { user: decodeURIComponent(url.username), pass: decodeURIComponent(url.password) }
        : undefined,
      pool: true,
      maxConnections: 3,
      tls: { rejectUnauthorized: true, minVersion: 'TLSv1.2' },
    });
  }

  async send(message: MailMessage): Promise<void> {
    const to = assertSingleLine(message.to.trim(), 'recipient');
    const subject = assertSingleLine(message.subject, 'subject');

    if (!this.transporter) {
      // Development only — env validation refuses to boot production this way.
      this.logger.log(`\n--- MAIL ---\nTo: ${to}\nSubject: ${subject}\n\n${message.body}\n------------`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.config.get<string>('mailFrom'),
        to,
        subject,
        text: message.body,
      });
    } catch (error) {
      // Never log the address or the body: this log is the one place a sign-in
      // link could leak into shared infrastructure.
      this.logger.error(`Delivery failed for a ${subject.slice(0, 24)}… message`);
      throw error;
    }
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) return true;
    try {
      return await this.transporter.verify();
    } catch {
      return false;
    }
  }
}
