import { z } from 'zod';
import { CASE_STAGES } from '../enums';
import { PATH_LIMITS } from '../limits';
import { LOCALES } from '../locales';

/**
 * Module D — The Path. Every schema here is written once and applied to both
 * parties. There is deliberately no "initiator" privilege: the party who opens
 * the case gets exactly the rights the invited party gets (D-3).
 */
export const openCaseSchema = z.object({
  situation: z.string().trim().min(50).max(PATH_LIMITS.intakeSituationMax),
  hopedFor: z.string().trim().min(20).max(PATH_LIMITS.intakeHopeMax),
  willingToOffer: z.string().trim().min(20).max(PATH_LIMITS.intakeOfferMax),
  language: z.enum(LOCALES),
  /** The second party is invited by email; they must consent before anything proceeds (D-1). */
  inviteEmail: z.string().trim().email().max(254),
  /** D-8 acknowledgement: the opener confirms this is not an out-of-scope matter. */
  scopeAcknowledged: z.literal(true),
});

export const respondToInviteSchema = z.object({
  inviteToken: z.string().min(16).max(128),
  consent: z.boolean(),
  situation: z.string().trim().min(50).max(PATH_LIMITS.intakeSituationMax).optional(),
  hopedFor: z.string().trim().min(20).max(PATH_LIMITS.intakeHopeMax).optional(),
  willingToOffer: z.string().trim().min(20).max(PATH_LIMITS.intakeOfferMax).optional(),
});

/** Word count, not character count — fairer across scripts (Arabic vs. English). */
export const submitStatementSchema = z.object({
  stage: z.enum(CASE_STAGES),
  body: z.string().trim().min(1),
});

export function countWords(text: string): number {
  const matched = text.trim().match(/\S+/g);
  return matched ? matched.length : 0;
}

export function isWithinStatementLimit(text: string): boolean {
  return countWords(text) <= PATH_LIMITS.statementWordsMax;
}

/** D-5: either party may request a different facilitator once, no reason required. */
export const requestFacilitatorChangeSchema = z.object({
  reason: z.string().trim().max(1000).optional(),
});

/** D-6: an anonymised outcome is published only if both parties say yes. */
export const publicationConsentSchema = z.object({
  consent: z.boolean(),
});

/** D-7: withdrawal at any stage, with no penalty and no public record. */
export const withdrawCaseSchema = z.object({
  confirmation: z.literal('WITHDRAW'),
});
