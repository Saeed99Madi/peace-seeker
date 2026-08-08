import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { CaseStage } from '@peace/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { orderPartiesForDisplay } from '../../common/utils/shuffle.util';
import { CasesService } from './cases.service';
import { SymmetryService } from './symmetry.service';

@Injectable()
export class StatementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cases: CasesService,
    private readonly symmetry: SymmetryService,
    private readonly audit: AuditService,
  ) {}

  /**
   * D-2/D-3 — a statement is accepted under limits identical for both parties,
   * and is held unreleased until the facilitator has read it for language that
   * attacks the person rather than describing the problem.
   *
   * Note what does not happen here: the text is never altered. Assisted
   * rephrasing is offered to the author as a suggestion elsewhere; the author
   * always retains the final wording.
   */
  async submit(userId: string, caseId: string, stage: CaseStage, body: string) {
    const record = await this.prisma.case.findUnique({ where: { id: caseId } });
    if (!record) throw new NotFoundException('No such case.');
    if (record.status !== 'ACTIVE') throw new ForbiddenException('This case is not open.');
    if (record.stage !== stage) throw new ForbiddenException('That is not the current stage.');

    const party = await this.cases.requireParty(caseId, userId);
    this.symmetry.assertWindowOpen(record.stageDueAt);

    const existing = await this.prisma.caseStatement.findUnique({
      where: { caseId_partyId_stage: { caseId, partyId: party.id, stage } },
    });
    this.symmetry.assertNotAlreadySubmitted(existing, stage);
    const wordCount = this.symmetry.assertWithinLimit(body);

    await this.prisma.caseStatement.create({
      data: { caseId, partyId: party.id, stage, body, wordCount },
    });
    await this.audit.record({
      actorId: userId,
      action: 'case.statement_submitted',
      target: `case:${caseId}`,
      metadata: { stage },
    });

    return { submitted: true, wordCount };
  }

  /** D-2 — the facilitator releases both statements together, or neither. */
  async release(facilitatorId: string, caseId: string, stage: CaseStage) {
    const statements = await this.prisma.caseStatement.findMany({ where: { caseId, stage } });
    if (statements.length < 2) {
      throw new ForbiddenException('Both parties must have spoken before either is released.');
    }
    const now = new Date();
    await this.prisma.caseStatement.updateMany({
      where: { caseId, stage },
      data: { reviewedAt: now, releasedAt: now },
    });
    await this.audit.record({
      actorId: facilitatorId,
      action: 'case.stage_released',
      target: `case:${caseId}`,
      metadata: { stage },
    });
  }

  /**
   * The case as one party sees it. The other party's identity is presented by
   * an unstable side token and the two parties are ordered randomly per view,
   * so no interface position ever reads as "first" or "principal" (§3.1).
   */
  async view(userId: string, caseId: string, seed: string) {
    const record = await this.prisma.case.findUnique({
      where: { id: caseId },
      include: { parties: true, statements: true, followUps: true },
    });
    if (!record) throw new NotFoundException('No such case.');

    const me = record.parties.find((party) => party.userId === userId);
    if (!me) throw new ForbiddenException('This case is not yours to see.');
    const other = record.parties.find((party) => party.id !== me.id) ?? null;

    const bothSubmitted =
      record.parties.length === 2 &&
      record.statements.filter((statement) => statement.stage === record.stage).length === 2;

    const visible = this.symmetry
      .visibleStatements(record.statements, me.id, bothSubmitted)
      .map((statement) => this.symmetry.redactForViewer(statement, me.id));

    const [firstSide, secondSide] = other
      ? orderPartiesForDisplay(me.sideToken, other.sideToken, `${seed}:${caseId}`)
      : [me.sideToken, null];

    return {
      id: record.id,
      reference: record.reference,
      status: record.status,
      stage: record.stage,
      stageDueAt: record.stageDueAt?.toISOString() ?? null,
      language: record.language,
      mySideToken: me.sideToken,
      displayOrder: [firstSide, secondSide],
      statements: visible,
      followUps: record.followUps.map((f) => ({ dayOffset: f.dayOffset, dueAt: f.dueAt, done: !!f.completedAt })),
      /** D-5 — either party may change facilitator once, without a reason. */
      facilitatorChangeAvailable: me.facilitatorChangesUsed < 1,
    };
  }

  /** Advances the stage once both parties' statements have been released. */
  async advance(facilitatorId: string, caseId: string) {
    const record = await this.prisma.case.findUnique({
      where: { id: caseId },
      include: { statements: true },
    });
    if (!record) throw new NotFoundException('No such case.');

    const released = record.statements.filter(
      (statement) => statement.stage === record.stage && statement.releasedAt,
    );
    if (released.length < 2) {
      throw new ForbiddenException('This stage is not complete for both parties.');
    }

    const next = this.cases.nextStage(record.stage);
    await this.prisma.case.update({
      where: { id: caseId },
      data: {
        stage: next,
        stageDueAt: this.symmetry.nextStageDeadline(),
        ...(next === 'FOLLOW_UP' ? { status: 'CLOSED', closedAt: new Date() } : {}),
      },
    });
    if (next === 'FOLLOW_UP') await this.cases.scheduleFollowUps(caseId);

    await this.audit.record({
      actorId: facilitatorId,
      action: 'case.stage_advanced',
      target: `case:${caseId}`,
      metadata: { to: next },
    });
    return { stage: next };
  }
}
