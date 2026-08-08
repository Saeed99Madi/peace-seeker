import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { generateToken, tokenHash } from '../../common/utils/hash.util';

const TTL_MINUTES = 20;

/**
 * S-9 — magic links, the preferred credential. A member who never sets a
 * password has no password to be compelled to disclose.
 */
@Injectable()
export class MagicLinkService {
  private readonly logger = new Logger(MagicLinkService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  async issue(userId: string, email: string, locale: string): Promise<void> {
    const token = generateToken();
    await this.prisma.magicLinkToken.create({
      data: {
        userId,
        tokenHash: tokenHash(token),
        expiresAt: new Date(Date.now() + TTL_MINUTES * 60 * 1000),
      },
    });

    const url = `${this.config.get<string>('webOrigin')}/${locale}/auth/verify?token=${token}`;
    await this.mail.send({
      to: email,
      subject: 'Your Peace Seekers sign-in link',
      body: `Sign in: ${url}\n\nThis link works once and expires in ${TTL_MINUTES} minutes.`,
    });
  }

  /** Single use: the token is burned whether or not the session then succeeds. */
  async consume(token: string): Promise<string | null> {
    const record = await this.prisma.magicLinkToken.findUnique({
      where: { tokenHash: tokenHash(token) },
    });
    if (!record || record.usedAt || record.expiresAt < new Date()) return null;

    await this.prisma.magicLinkToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });
    return record.userId;
  }

  /** Housekeeping: expired tokens carry no value and should not linger (S-1). */
  async purgeExpired(): Promise<number> {
    const { count } = await this.prisma.magicLinkToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    if (count > 0) this.logger.log(`Purged ${count} expired magic-link tokens`);
    return count;
  }
}
