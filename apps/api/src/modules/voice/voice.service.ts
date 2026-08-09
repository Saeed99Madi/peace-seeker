import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RETENTION, type CreateVoiceData } from '@peace/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { generateToken, tokenHash } from '../../common/utils/hash.util';
import { seededShuffle } from '../../common/utils/shuffle.util';
import { VOICE_ARRIVED_CHANNEL, VoiceCounterService } from './voice-counter.service';
import { RedisService } from '../../redis/redis.service';
import { toPublicVoice, type PublicVoiceDto } from './voice.mapper';

export interface SubmitContext {
  ipHash?: string;
  email?: string;
  locale: string;
  userId?: string;
}

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly counter: VoiceCounterService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {}

  /**
   * A-1 — no account required. A-3 — any attached media is held PENDING until
   * moderation clears it, so an upload can never appear on the Wall unreviewed.
   */
  async submit(input: CreateVoiceData, context: SubmitContext): Promise<{ id: string }> {
    const withdrawalToken = generateToken();
    const media = input.mediaUploadId
      ? await this.prisma.mediaAsset.findUnique({ where: { id: input.mediaUploadId } })
      : null;

    // A text-only Voice is published immediately; media goes to the queue (E-1).
    const status = media ? 'PENDING' : 'PUBLISHED';

    const voice = await this.prisma.voice.create({
      data: {
        userId: context.userId,
        displayName: input.displayName,
        country: input.country,
        message: input.message?.trim() || null,
        locale: input.locale ?? context.locale,
        displayMode: input.displayMode,
        mediaId: media?.id,
        status,
        withdrawalTokenHash: tokenHash(withdrawalToken),
        ipHash: context.ipHash,
        ipHashExpiry: context.ipHash
          ? new Date(Date.now() + RETENTION.hashedIpDays * 86_400_000)
          : null,
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
      },
      select: { id: true, country: true },
    });

    if (status === 'PUBLISHED') {
      await this.counter.adjust(1, voice.country);
      // Announce the voice itself, so the Wall can show it arriving. Only the
      // public projection is sent — the same fields the Wall already serves to
      // anyone (A-5), never the submitter, the address hash or the token.
      const published = await this.prisma.voice.findUnique({
        where: { id: voice.id },
        include: { media: true },
      });
      if (published) {
        await this.redis.publish(
          VOICE_ARRIVED_CHANNEL,
          toPublicVoice(published, `${this.config.get<string>('apiPublicUrl')}/media`),
        );
      }
    }
    if (context.email) await this.sendWithdrawalLink(context.email, withdrawalToken, context.locale);

    return { id: voice.id };
  }

  /**
   * A-5 — the Wall. Randomised order is preferred so that no message and no
   * origin is privileged; the seed is per-reader so paging stays coherent.
   */
  async wall(seed: string, limit: number, offset: number): Promise<PublicVoiceDto[]> {
    // Randomising the whole table per reader is not affordable at a million
    // rows, so a recent window is drawn and shuffled within itself.
    const window = await this.prisma.voice.findMany({
      where: { status: 'PUBLISHED' },
      include: { media: true },
      orderBy: { createdAt: 'desc' },
      take: Math.min(offset + limit, 500),
    });
    const base = this.config.get<string>('apiPublicUrl') ?? '';
    return seededShuffle(window, seed)
      .slice(offset, offset + limit)
      .map((voice) => toPublicVoice(voice, `${base}/media`));
  }

  /** A-9 — one click, no account, no questions asked. */
  async withdraw(token: string): Promise<void> {
    const voice = await this.prisma.voice.findUnique({
      where: { withdrawalTokenHash: tokenHash(token) },
      select: { id: true, status: true, country: true },
    });
    if (!voice) throw new NotFoundException('This withdrawal link is no longer valid.');
    if (voice.status === 'WITHDRAWN') return;

    await this.prisma.voice.update({
      where: { id: voice.id },
      data: { status: 'WITHDRAWN', withdrawnAt: new Date(), message: null, ipHash: null },
    });
    if (voice.status === 'PUBLISHED') await this.counter.adjust(-1);
    this.logger.log(`Voice ${voice.id} withdrawn by its author`);
  }

  private async sendWithdrawalLink(email: string, token: string, locale: string): Promise<void> {
    const url = `${this.config.get<string>('webOrigin')}/${locale}/voices/withdraw?token=${token}`;
    await this.mail.send({
      to: email,
      subject: 'Your voice for peace — and how to withdraw it',
      body:
        `Thank you for adding your voice.\n\n` +
        `If you ever want it removed, this link does it in one click, with no account and no questions:\n${url}\n\n` +
        `Keep it somewhere safe — it is the only copy we send.`,
    });
  }
}
