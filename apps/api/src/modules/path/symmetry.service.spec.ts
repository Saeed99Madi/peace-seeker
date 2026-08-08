import { ForbiddenException } from '@nestjs/common';
import { PATH_LIMITS } from '@peace/shared';
import type { CaseParty, CaseStatement } from '@prisma/client';
import { SymmetryService } from './symmetry.service';

/**
 * These tests are the guarantee behind §3.1. If one of them starts failing, the
 * platform has stopped being symmetric, and that is not a bug like other bugs:
 * it is the platform doing the one thing its charter forbids.
 */
describe('SymmetryService', () => {
  const symmetry = new SymmetryService();

  const statement = (partyId: string, released: boolean): CaseStatement =>
    ({
      id: `s-${partyId}`,
      caseId: 'case-1',
      partyId,
      stage: 'SITUATION',
      body: 'text',
      wordCount: 1,
      reviewedAt: released ? new Date() : null,
      releasedAt: released ? new Date() : null,
      submittedAt: new Date('2026-01-01T10:00:00Z'),
    }) as CaseStatement;

  describe('word limits', () => {
    it('applies the same limit whichever party is asking', () => {
      const body = 'word '.repeat(PATH_LIMITS.statementWordsMax).trim();
      expect(symmetry.assertWithinLimit(body)).toBe(PATH_LIMITS.statementWordsMax);
    });

    it('refuses a statement over the limit', () => {
      const body = 'word '.repeat(PATH_LIMITS.statementWordsMax + 1).trim();
      expect(() => symmetry.assertWithinLimit(body)).toThrow(ForbiddenException);
    });
  });

  describe('visibility', () => {
    it("hides the other party's statement until both have spoken", () => {
      const statements = [statement('me', false), statement('them', true)];
      const visible = symmetry.visibleStatements(statements, 'me', false);
      expect(visible.map((s) => s.partyId)).toEqual(['me']);
    });

    it('releases both together once both have spoken and been reviewed', () => {
      const statements = [statement('me', true), statement('them', true)];
      const visible = symmetry.visibleStatements(statements, 'me', true);
      expect(visible).toHaveLength(2);
    });

    it('still withholds an unreviewed statement even when both have spoken', () => {
      const statements = [statement('me', true), statement('them', false)];
      const visible = symmetry.visibleStatements(statements, 'me', true);
      expect(visible.map((s) => s.partyId)).toEqual(['me']);
    });
  });

  describe('redaction', () => {
    it('never discloses how long the other party took', () => {
      const redacted = symmetry.redactForViewer(statement('them', true), 'me');
      expect(redacted.submittedAt).toBeNull();
      expect(redacted.mine).toBe(false);
    });

    it('shows a party their own submission time', () => {
      const redacted = symmetry.redactForViewer(statement('me', true), 'me');
      expect(redacted.submittedAt).not.toBeNull();
    });
  });

  describe('facilitator changes', () => {
    it('allows the first change without a reason', () => {
      const party = { facilitatorChangesUsed: 0 } as CaseParty;
      expect(() => symmetry.assertFacilitatorChangeAvailable(party)).not.toThrow();
    });

    it('allows only one, identically for both parties', () => {
      const party = { facilitatorChangesUsed: 1 } as CaseParty;
      expect(() => symmetry.assertFacilitatorChangeAvailable(party)).toThrow(ForbiddenException);
    });
  });
});
