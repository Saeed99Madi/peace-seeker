import { z } from 'zod';
import { COUNTRY_CODES } from '../countries';
import { PROFILE_VISIBILITIES, DEFAULT_PROFILE_VISIBILITY } from '../enums';
import { LOCALES } from '../locales';
import { MEMBER_LIMITS } from '../limits';

const introduction = z
  .string()
  .trim()
  .min(MEMBER_LIMITS.introductionMin)
  .max(MEMBER_LIMITS.introductionMax);

/**
 * Module B — Membership. B-1: the self-introduction is the requirement; B-4:
 * affirming the Founding Vision is the substantive act of joining.
 */
export const registerSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(MEMBER_LIMITS.displayNameMin)
    .max(MEMBER_LIMITS.displayNameMax),
  email: z.string().trim().email().max(254),
  introduction,
  locale: z.enum(LOCALES).optional(),
  /** B-4 — recorded with a timestamp and the charter version affirmed. */
  charterAffirmed: z.literal(true),
  codeOfConductAffirmed: z.literal(true),
  /** S-9: passwords are optional; magic links are the preferred path. */
  password: z
    .string()
    .min(MEMBER_LIMITS.passwordMin)
    .max(MEMBER_LIMITS.passwordMax)
    .optional(),
});

export type RegisterInput = z.input<typeof registerSchema>;

/** B-2: optional profile fields only. Nothing here identifies a group (B-3). */
export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(MEMBER_LIMITS.displayNameMax).optional(),
  introduction: introduction.optional(),
  country: z.enum(COUNTRY_CODES).nullable().optional(),
  languages: z.array(z.string().min(2).max(12)).max(MEMBER_LIMITS.maxLanguages).optional(),
  skills: z.array(z.string().trim().min(2).max(40)).max(MEMBER_LIMITS.maxSkills).optional(),
  links: z.array(z.string().url().max(300)).max(MEMBER_LIMITS.maxLinks).optional(),
  avatarUploadId: z.string().uuid().nullable().optional(),
  visibility: z.enum(PROFILE_VISIBILITIES).default(DEFAULT_PROFILE_VISIBILITY).optional(),
});

/** B-6: searchable by language and offered skill only. */
export const memberSearchSchema = z.object({
  language: z.string().min(2).max(12).optional(),
  skill: z.string().min(2).max(40).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export interface PublicMember {
  id: string;
  displayName: string;
  introduction: string | null;
  country: string | null;
  languages: string[];
  skills: string[];
  avatarUrl: string | null;
  joinedAt: string;
}
