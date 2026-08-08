import { ForbiddenException, Injectable } from '@nestjs/common';
import { PATH_LIMITS, countWords, type CaseStage } from '@peace/shared';
import type { CaseParty, CaseStatement } from '@prisma/client';

/**
 * §3.1 / D-3 — structural symmetry, enforced in one place.
 *
 * Every rule here is written without reference to *which* party is asking. The
 * service takes "the asking party" and "the other party" and applies the same
 * test to both. If a future requirement ever needs a per-party exception, it
 * has to be added here, in the open, rather than appearing as a quiet `if` in a
 * controller.
 */
@Injectable()
export class SymmetryService {
  /** Identical word limit for both parties, at every stage. */
  assertWithinLimit(body: string): number {
    const words = countWords(body);
    if (words > PATH_LIMITS.statementWordsMax) {
      throw new ForbiddenException(
        `A statement may be up to ${PATH_LIMITS.statementWordsMax} words. This one is ${words}.`,
      );
    }
    return words;
  }

  /** Identical number of statements per stage — one each, no more. */
  assertNotAlreadySubmitted(existing: CaseStatement | null, stage: CaseStage): void {
    if (existing) {
      throw new ForbiddenException(`You have already given your statement for the ${stage} stage.`);
    }
  }

  /** Identical response window, measured from the moment the stage opened. */
  assertWindowOpen(stageDueAt: Date | null): void {
    if (stageDueAt && stageDueAt.getTime() < Date.now()) {
      throw new ForbiddenException('The window for this stage has closed. Your facilitator can reopen it.');
    }
  }

  nextStageDeadline(): Date {
    return new Date(Date.now() + PATH_LIMITS.responseWindowHours * 3_600_000);
  }

  /**
   * D-2/D-3 — a statement becomes visible to the other party only once the
   * facilitator has reviewed it AND both parties have submitted for the stage.
   * Releasing the first arrival immediately would let whoever answers second
   * shape their words around the first — an asymmetry of information.
   */
  visibleStatements(
    statements: CaseStatement[],
    viewerPartyId: string,
    bothSubmitted: boolean,
  ): CaseStatement[] {
    return statements.filter((statement) => {
      if (statement.partyId === viewerPartyId) return true;
      return bothSubmitted && statement.releasedAt !== null;
    });
  }

  /**
   * D-3 — neither party can see how long the other took or how many drafts they
   * wrote. This strips the timing metadata from the other side's statement.
   */
  redactForViewer(statement: CaseStatement, viewerPartyId: string) {
    const own = statement.partyId === viewerPartyId;
    return {
      id: statement.id,
      stage: statement.stage,
      body: statement.body,
      wordCount: statement.wordCount,
      mine: own,
      // Only your own submission time is yours to know.
      submittedAt: own ? statement.submittedAt.toISOString() : null,
    };
  }

  /** §3.1 — a party may change facilitator once, without giving a reason. */
  assertFacilitatorChangeAvailable(party: CaseParty): void {
    if (party.facilitatorChangesUsed >= 1) {
      throw new ForbiddenException(
        'You have already requested a change of facilitator once. Speak to the Foundation if there is a further difficulty.',
      );
    }
  }
}
