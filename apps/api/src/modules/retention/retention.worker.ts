import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { MagicLinkService } from '../auth/magic-link.service';
import { StatsService } from '../stats/stats.service';

/**
 * The other retention promises in §8, each with a deadline the platform states
 * publicly. Every one of them is a claim on the Safety page; this is the code
 * that makes the claims true.
 */
@Injectable()
export class RetentionWorker {
  private readonly logger = new Logger(RetentionWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly magicLinks: MagicLinkService,
    private readonly stats: StatsService,
  ) {}

  /**
   * S-7 — "IP addresses hashed and retained no longer than 7 days for abuse
   * mitigation only." The hash is set with an expiry at write time; this clears
   * the ones that have passed it.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async sweepAddressHashes(): Promise<void> {
    const { count } = await this.prisma.voice.updateMany({
      where: { ipHashExpiry: { lte: new Date() }, ipHash: { not: null } },
      data: { ipHash: null, ipHashExpiry: null },
    });
    if (count > 0) this.logger.log(`Cleared ${count} expired address hash(es)`);
  }

  /** Expired sign-in tokens carry no value and should not linger (S-1). */
  @Cron(CronExpression.EVERY_HOUR)
  async purgeExpiredTokens(): Promise<void> {
    await this.magicLinks.purgeExpired();

    const { count } = await this.prisma.session.deleteMany({
      where: { OR: [{ expiresAt: { lt: new Date() } }, { revokedAt: { not: null } }] },
    });
    if (count > 0) this.logger.log(`Removed ${count} finished session(s)`);
  }

  /** Case invitations that were never taken up (D-1). */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async purgeStaleInvites(): Promise<void> {
    const { count } = await this.prisma.caseInvite.deleteMany({
      where: { acceptedAt: null, expiresAt: { lt: new Date() } },
    });
    if (count > 0) this.logger.log(`Removed ${count} expired case invitation(s)`);
  }

  /**
   * E-3 — a nightly aggregate snapshot, so the Foundation can read growth
   * without anyone running live queries against member data.
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async captureStats(): Promise<void> {
    await this.stats.snapshot();
    this.logger.log('Captured nightly aggregate snapshot');
  }
}
