import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { AuditService } from '../audit/audit.service';
import { StorageService } from '../media/storage.service';

/**
 * S-5 — the right to disappear, actually executed.
 *
 * A deletion request that is recorded but never carried out is worse than no
 * promise at all: the member believes they are gone. This worker is what makes
 * the 30-day commitment true, and it writes to the member when the purge
 * completes, as §8 requires.
 */
@Injectable()
export class DeletionWorker {
  private readonly logger = new Logger(DeletionWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly mail: MailService,
    private readonly audit: AuditService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async run(): Promise<void> {
    const due = await this.prisma.deletionRequest.findMany({
      where: { completedAt: null, dueAt: { lte: new Date() } },
      include: { user: { select: { id: true, email: true, locale: true } } },
      take: 50,
    });
    if (due.length === 0) return;

    for (const request of due) {
      try {
        await this.purge(request.userId, request.voiceHandling);
        await this.prisma.deletionRequest.update({
          where: { id: request.id },
          data: { completedAt: new Date() },
        });
        await this.confirm(request.user.email, request.user.locale);
        await this.audit.record({
          action: 'member.deletion_completed',
          target: `user:${request.userId}`,
          metadata: { voiceHandling: request.voiceHandling },
        });
      } catch (error) {
        this.logger.error(`Deletion failed for request ${request.id}: ${String(error)}`);
      }
    }
    this.logger.log(`Processed ${due.length} deletion request(s)`);
  }

  /**
   * Voices are handled first and separately, because a Voice may outlive the
   * account: A-6 lets it stand anonymously, and S-5 makes that the member's
   * choice rather than ours.
   */
  private async purge(userId: string, voiceHandling: string): Promise<void> {
    if (voiceHandling === 'REMOVE') {
      await this.prisma.voice.updateMany({
        where: { userId },
        data: { status: 'WITHDRAWN', withdrawnAt: new Date(), message: null, ipHash: null },
      });
    } else {
      await this.prisma.voice.updateMany({
        where: { userId },
        data: { userId: null, displayMode: 'ANONYMOUS', displayName: '—', ipHash: null },
      });
    }

    const uploads = await this.prisma.mediaAsset.findMany({
      where: { uploaderId: userId },
      select: { id: true, storageKey: true },
    });
    for (const upload of uploads) await this.storage.remove(upload.storageKey);
    await this.prisma.mediaAsset.deleteMany({ where: { uploaderId: userId } });

    // Everything else attributed to the member goes with the row: the schema's
    // cascades cover sessions, credentials, posts, memberships and messages.
    await this.prisma.user.delete({ where: { id: userId } });
  }

  private async confirm(email: string, locale: string): Promise<void> {
    await this.mail
      .send({
        to: email,
        subject: 'Your Peace Seekers account has been deleted',
        body:
          `Everything attributed to you has been removed.\n\n` +
          `Backups still holding a copy are overwritten on their normal rotation, ` +
          `and no further copy is kept. This is the last message we will send you.\n\n` +
          `Thank you for having been here.`,
      })
      .catch(() => this.logger.warn(`Could not send deletion confirmation (locale ${locale})`));
  }
}
