import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

/**
 * M-3 — a documented appeals process available to every member.
 *
 * An appeal is never resolved by the moderator who made the original decision;
 * the service enforces that rather than trusting a convention.
 */
@Injectable()
export class AppealsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async open(decisionId: string, argument: string, memberId: string) {
    const decision = await this.prisma.moderationDecision.findUnique({
      where: { id: decisionId },
      select: { id: true },
    });
    if (!decision) throw new NotFoundException('No such decision.');

    const appeal = await this.prisma.appeal.create({
      data: { decisionId, argument },
      select: { id: true },
    });
    await this.audit.record({
      actorId: memberId,
      action: 'appeal.opened',
      target: `decision:${decisionId}`,
      metadata: { appealId: appeal.id },
    });
    return appeal;
  }

  async list(status = 'OPEN') {
    return this.prisma.appeal.findMany({
      where: { status },
      include: { decision: { select: { action: true, ruleApplied: true, moderatorId: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async resolve(appealId: string, reviewerId: string, upheld: boolean, outcome: string) {
    const appeal = await this.prisma.appeal.findUnique({
      where: { id: appealId },
      include: { decision: { select: { moderatorId: true } } },
    });
    if (!appeal) throw new NotFoundException('No such appeal.');
    if (appeal.decision.moderatorId === reviewerId) {
      throw new ForbiddenException(
        'An appeal must be reviewed by someone other than the moderator who decided it.',
      );
    }

    const updated = await this.prisma.appeal.update({
      where: { id: appealId },
      data: {
        status: upheld ? 'UPHELD' : 'DECLINED',
        outcome,
        resolvedAt: new Date(),
      },
    });
    await this.audit.record({
      actorId: reviewerId,
      action: upheld ? 'appeal.upheld' : 'appeal.declined',
      target: `appeal:${appealId}`,
      metadata: { outcome },
    });
    return updated;
  }
}
