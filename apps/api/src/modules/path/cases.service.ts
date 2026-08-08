import { ForbiddenException, Injectable } from '@nestjs/common';
import { CASE_STAGES, PATH_LIMITS, type CaseStage } from '@peace/shared';
import type { z } from 'zod';
import type { openCaseSchema } from '@peace/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { generateToken, publicReference } from '../../common/utils/hash.util';
import { CaseInvitesService } from './case-invites.service';
import { ScopeRoutingService } from './scope-routing.service';

export type OpenCaseDto = z.output<typeof openCaseSchema>;

@Injectable()
export class CasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: ScopeRoutingService,
    private readonly invites: CaseInvitesService,
    private readonly audit: AuditService,
  ) {}

  /**
   * D-1 — either party may open a case, and opening it confers no advantage:
   * the row created here is structurally identical to the one created when the
   * other party consents.
   *
   * D-8 — an out-of-scope matter stops here and is referred to professional
   * services. No invitation is sent, so no accusation ever reaches anyone.
   */
  async open(userId: string, dto: OpenCaseDto) {
    const assessment = this.scope.assess(dto.situation, dto.hopedFor, dto.willingToOffer);
    if (!assessment.inScope) {
      return { status: 'ROUTED_OUT' as const, reason: assessment.reason };
    }

    const created = await this.prisma.case.create({
      data: {
        reference: publicReference('PATH'),
        language: dto.language,
        parties: {
          create: {
            userId,
            sideToken: generateToken(8),
            consentedAt: new Date(),
            situation: dto.situation,
            hopedFor: dto.hopedFor,
            willingToOffer: dto.willingToOffer,
          },
        },
      },
      select: { id: true, reference: true },
    });

    await this.invites.invite(created.id, dto.inviteEmail, dto.language);
    await this.audit.record({ actorId: userId, action: 'case.opened', target: `case:${created.id}` });
    return { status: 'AWAITING_CONSENT' as const, ...created };
  }

  /** D-7 — withdrawal at any stage, without penalty, stigma or public record. */
  async withdraw(userId: string, caseId: string) {
    const party = await this.requireParty(caseId, userId);
    await this.prisma.$transaction([
      this.prisma.caseParty.update({ where: { id: party.id }, data: { withdrawnAt: new Date() } }),
      this.prisma.case.update({
        where: { id: caseId },
        data: { status: 'WITHDRAWN', closedAt: new Date() },
      }),
    ]);
    // Recorded for the Foundation's own accountability; never published (D-7).
    await this.audit.record({ actorId: userId, action: 'case.withdrawn', target: `case:${caseId}` });
    return { status: 'WITHDRAWN' as const };
  }

  /** D-6 — publication needs both parties, each answering for themselves. */
  async setPublicationConsent(userId: string, caseId: string, consent: boolean) {
    const party = await this.requireParty(caseId, userId);
    await this.prisma.caseParty.update({
      where: { id: party.id },
      data: { publicationConsent: consent },
    });
    const parties = await this.prisma.caseParty.findMany({ where: { caseId } });
    return { bothConsented: parties.length === 2 && parties.every((p) => p.publicationConsent) };
  }

  /** §13 — the same question of both sides; the *gap* is the quality metric. */
  async rateFairness(userId: string, caseId: string, rating: number) {
    const party = await this.requireParty(caseId, userId);
    await this.prisma.caseParty.update({
      where: { id: party.id },
      data: { fairnessRating: Math.min(Math.max(Math.round(rating), 1), 5) },
    });
    return { recorded: true };
  }

  async requireParty(caseId: string, userId: string) {
    const party = await this.prisma.caseParty.findUnique({
      where: { caseId_userId: { caseId, userId } },
    });
    if (!party) throw new ForbiddenException('This case is not yours to see.');
    return party;
  }

  nextStage(current: CaseStage): CaseStage {
    const index = CASE_STAGES.indexOf(current);
    return CASE_STAGES[Math.min(index + 1, CASE_STAGES.length - 1)];
  }

  /** D-4 stage 7 — check-ins at 30 and 90 days. */
  async scheduleFollowUps(caseId: string): Promise<void> {
    await this.prisma.caseFollowUp.createMany({
      data: PATH_LIMITS.followUpDays.map((dayOffset) => ({
        caseId,
        dayOffset,
        dueAt: new Date(Date.now() + dayOffset * 86_400_000),
      })),
      skipDuplicates: true,
    });
  }
}
