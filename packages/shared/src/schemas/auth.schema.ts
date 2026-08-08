import { z } from 'zod';
import { MEMBER_LIMITS } from '../limits';
import { LOCALES } from '../locales';

/** S-9: magic links are the default credential; passwords are opt-in. */
export const requestMagicLinkSchema = z.object({
  email: z.string().trim().email().max(254),
  locale: z.enum(LOCALES).optional(),
});

export const consumeMagicLinkSchema = z.object({
  token: z.string().min(16).max(256),
});

export const passwordLoginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(MEMBER_LIMITS.passwordMax),
});

export const setPasswordSchema = z.object({
  password: z.string().min(MEMBER_LIMITS.passwordMin).max(MEMBER_LIMITS.passwordMax),
});

/** S-10: instantly de-list everything attributed to me, without deleting it. */
export const hidePresenceSchema = z.object({
  hidden: z.boolean(),
});

/** S-5: the right to disappear. Public Voices are anonymised or removed, my choice. */
export const deleteAccountSchema = z.object({
  confirmation: z.literal('DELETE'),
  voiceHandling: z.enum(['ANONYMISE', 'REMOVE']).default('ANONYMISE'),
});

export interface SessionUser {
  id: string;
  displayName: string;
  email: string;
  roles: string[];
  locale: string;
  status: string;
  charterAffirmedAt: string | null;
}
