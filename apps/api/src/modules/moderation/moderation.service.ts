import { Injectable, NotFoundException } from '@nestjs/common';
import type { ModerationAction, ReportTargetType } from '@prisma/client';
import type { z } from 'zod';
import type { createReportSchema, moderationDecisionSchema } from '@peace/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { VoiceCounterService } from '../voice/voice-counter.service';

export type CreateReportDto = z.output<typeof createReportSchema>;
export type DecisionDto = z.output<typeof moderationDecisionSchema>;

@Injectable()
export class ModerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly counter: VoiceCounterService,
  ) {}

  async report(dto: CreateReportDto, reporterId?: string) {
    const report = await this.prisma.report.create({
      data: {
        targetType: dto.targetType,
        targetId: dto.targetId,
        reason: dto.reason,
        detail: dto.detail,
        reporterId,
      },
      select: { id: true },
    });
    return report;
  }

  /** E-1 — one queue per kind of pending work, oldest first. */
  async queue(kind: 'VOICES' | 'MEDIA' | 'REPORTS' | 'STORIES', page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    if (kind === 'VOICES') {
      return this.prisma.voice.findMany({
        where: { status: 'PENDING' },
        include: { media: true },
        orderBy: { createdAt: 'asc' },
        skip,
        take: pageSize,
      });
    }
    if (kind === 'MEDIA') {
      return this.prisma.mediaAsset.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
        skip,
        take: pageSize,
      });
    }
    if (kind === 'STORIES') {
      return this.prisma.post.findMany({
        where: { type: 'STORY', status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
        skip,
        take: pageSize,
      });
    }
    return this.prisma.report.findMany({
      where: { status: 'OPEN' },
      orderBy: { createdAt: 'asc' },
      skip,
      take: pageSize,
    });
  }

  /**
   * Published voices, for the admin panel.
   *
   * The queues above list only what is *awaiting* a decision, which left a
   * published voice unreachable — there was no way to take one down except by
   * editing the database directly. Anything a moderator may act on has to be
   * findable in the interface, or the audit trail (M-2) has a hole in it.
   */
  async publishedVoices(page: number, pageSize: number) {
    const where = { status: 'PUBLISHED' as const };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.voice.findMany({
        where,
        select: {
          id: true,
          displayName: true,
          displayMode: true,
          country: true,
          message: true,
          locale: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.voice.count({ where }),
    ]);
    return { items, page, pageSize, total };
  }

  /**
   * M-2 — one decision path for every kind of target, recording the rule that
   * was applied. Identical facts must produce identical outcomes regardless of
   * who the speaker is, and the only way to check that later is to log which
   * rule was invoked, every time.
   */
  async decide(
    moderatorId: string,
    targetType: ReportTargetType,
    targetId: string,
    dto: DecisionDto,
    reportId?: string,
  ) {
    await this.applyToTarget(targetType, targetId, dto.action);

    const decision = await this.prisma.moderationDecision.create({
      data: {
        reportId,
        targetType,
        targetId,
        moderatorId,
        action: dto.action as ModerationAction,
        ruleApplied: dto.ruleApplied,
        note: dto.note,
      },
      select: { id: true },
    });

    if (reportId) {
      await this.prisma.report.update({ where: { id: reportId }, data: { status: 'RESOLVED' } });
    }
    await this.audit.record({
      actorId: moderatorId,
      action: `moderation.${dto.action.toLowerCase()}`,
      target: `${targetType.toLowerCase()}:${targetId}`,
      metadata: { ruleApplied: dto.ruleApplied ?? null, decisionId: decision.id },
    });
    return decision;
  }

  private async applyToTarget(
    targetType: ReportTargetType,
    targetId: string,
    action: DecisionDto['action'],
  ): Promise<void> {
    if (action === 'DISMISS_REPORT') return;

    const status = action === 'APPROVE' ? 'PUBLISHED' : action === 'HIDE' ? 'HIDDEN' : 'REJECTED';

    if (targetType === 'VOICE') {
      const voice = await this.prisma.voice.findUnique({
        where: { id: targetId },
        select: { status: true, country: true },
      });
      if (!voice) throw new NotFoundException('That item no longer exists.');
      await this.prisma.voice.update({
        where: { id: targetId },
        data: { status, publishedAt: status === 'PUBLISHED' ? new Date() : null },
      });
      if (voice.status !== 'PUBLISHED' && status === 'PUBLISHED') {
        await this.counter.adjust(1, voice.country);
      } else if (voice.status === 'PUBLISHED' && status !== 'PUBLISHED') {
        await this.counter.adjust(-1);
      }
      return;
    }
    if (targetType === 'POST') {
      await this.prisma.post.update({ where: { id: targetId }, data: { status } });
      return;
    }
    if (targetType === 'MEMBER' && action === 'SUSPEND_ACCOUNT') {
      await this.prisma.user.update({ where: { id: targetId }, data: { status: 'SUSPENDED' } });
      await this.prisma.session.updateMany({
        where: { userId: targetId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  }
}
