import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { z } from 'zod';
import type { respondToInviteSchema } from '@peace/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { AuditService } from '../audit/audit.service';
import { generateToken, keyedHash, tokenHash } from '../../common/utils/hash.util';
import { ScopeRoutingService } from './scope-routing.service';
import { SymmetryService } from './symmetry.service';

export type InviteResponseDto = z.output<typeof respondToInviteSchema>;

const INVITE_TTL_DAYS = 14;

/** D-1 — no case proceeds without both parties' explicit, informed consent. */
@Injectable()
export class CaseInvitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: ScopeRoutingService,
    private readonly symmetry: SymmetryService,
    private readonly mail: MailService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
  ) {}

  async invite(caseId: string, email: string, locale: string): Promise<void> {
    const token = generateToken();
    await this.prisma.caseInvite.create({
      data: {
        caseId,
        emailHash: keyedHash(email, this.config.get<string>('emailHashPepper') ?? ''),
        tokenHash: tokenHash(token),
        expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 86_400_000),
      },
    });
    await this.send(email, token, locale);
  }

  /**
   * Declining is a complete answer. Nothing is disclosed to the party who
   * opened the case beyond the fact that it will not proceed — no reason, no
   * record, no follow-up (D-1, D-7).
   */
  async respond(userId: string, dto: InviteResponseDto) {
    const invite = await this.prisma.caseInvite.findUnique({
      where: { tokenHash: tokenHash(dto.inviteToken) },
    });
    if (!invite || invite.acceptedAt || invite.declinedAt || invite.expiresAt < new Date()) {
      throw new NotFoundException('This invitation is no longer valid.');
    }

    if (!dto.consent) return this.decline(invite.id, invite.caseId);

    const assessment = this.scope.assess(dto.situation, dto.hopedFor, dto.willingToOffer);
    if (!assessment.inScope) {
      await this.prisma.case.update({
        where: { id: invite.caseId },
        data: { status: 'ROUTED_OUT', outOfScope: assessment.reason, closedAt: new Date() },
      });
      return { status: 'ROUTED_OUT' as const, reason: assessment.reason };
    }

    await this.accept(invite.id, invite.caseId, userId, dto);
    await this.audit.record({
      actorId: userId,
      action: 'case.consented',
      target: `case:${invite.caseId}`,
    });
    return { status: 'ACTIVE' as const, caseId: invite.caseId };
  }

  private async decline(inviteId: string, caseId: string) {
    await this.prisma.$transaction([
      this.prisma.caseInvite.update({ where: { id: inviteId }, data: { declinedAt: new Date() } }),
      this.prisma.case.update({
        where: { id: caseId },
        data: { status: 'WITHDRAWN', closedAt: new Date() },
      }),
    ]);
    return { status: 'DECLINED' as const };
  }

  private async accept(inviteId: string, caseId: string, userId: string, dto: InviteResponseDto) {
    await this.prisma.$transaction([
      this.prisma.caseParty.create({
        data: {
          caseId,
          userId,
          // A random label, so no stable "Party A / Party B" ordering exists.
          sideToken: generateToken(8),
          consentedAt: new Date(),
          situation: dto.situation,
          hopedFor: dto.hopedFor,
          willingToOffer: dto.willingToOffer,
        },
      }),
      this.prisma.caseInvite.update({ where: { id: inviteId }, data: { acceptedAt: new Date() } }),
      this.prisma.case.update({
        where: { id: caseId },
        data: {
          status: 'ACTIVE',
          stage: 'SITUATION',
          stageDueAt: this.symmetry.nextStageDeadline(),
        },
      }),
    ]);
  }

  private async send(email: string, token: string, locale: string): Promise<void> {
    const url = `${this.config.get<string>('webOrigin')}/${locale}/path/invitation?token=${token}`;
    await this.mail.send({
      to: email,
      subject: 'An invitation to work towards an understanding',
      body:
        `Someone has asked to work through a difficulty with you, with the help of a neutral facilitator.\n\n` +
        `Nothing has been shared about you, and nothing proceeds unless you agree:\n${url}\n\n` +
        `You may decline, and you may stop at any point afterwards. There is no penalty, and no public record is made.`,
    });
  }
}
