import { z } from 'zod';
import { REPORT_REASONS } from '../enums';

/** M-1 — reportable conduct, named exactly as the Code of Conduct names it. */
export const createReportSchema = z.object({
  targetType: z.enum(['VOICE', 'POST', 'MEMBER', 'CIRCLE', 'MESSAGE', 'EVENT']),
  targetId: z.string().uuid(),
  reason: z.enum(REPORT_REASONS),
  detail: z.string().trim().max(2000).optional(),
});

/**
 * M-2 — a moderation decision records the rule applied, not who the speaker is.
 * The queue never surfaces a speaker's country or language as a decision input.
 */
export const moderationDecisionSchema = z.object({
  action: z.enum(['APPROVE', 'HIDE', 'REJECT', 'SUSPEND_ACCOUNT', 'DISMISS_REPORT']),
  ruleApplied: z.enum(REPORT_REASONS).optional(),
  note: z.string().trim().max(2000).optional(),
});

/** M-3 — every member can appeal every decision. */
export const appealSchema = z.object({
  decisionId: z.string().uuid(),
  argument: z.string().trim().min(20).max(4000),
});

export const moderationQueueQuerySchema = z.object({
  queue: z.enum(['VOICES', 'MEDIA', 'REPORTS', 'STORIES']).default('REPORTS'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});
