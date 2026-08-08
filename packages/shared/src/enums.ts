/** Enumerations mirrored one-to-one by the Prisma schema. */

/** A-6: how a Voice is attributed publicly. Default is first-name-only. */
export const VOICE_DISPLAY_MODES = ['NAME', 'FIRST_NAME', 'ANONYMOUS'] as const;
export type VoiceDisplayMode = (typeof VOICE_DISPLAY_MODES)[number];
export const DEFAULT_VOICE_DISPLAY_MODE: VoiceDisplayMode = 'FIRST_NAME';

/** Every publishable artefact moves through the same moderation states (E-1). */
export const CONTENT_STATUSES = ['PENDING', 'PUBLISHED', 'HIDDEN', 'WITHDRAWN', 'REJECTED'] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

/** §4. Roles are additive and never displayed as a hierarchy (§3.1). */
export const USER_ROLES = [
  'MEMBER',
  'CIRCLE_STEWARD',
  'FACILITATOR',
  'MODERATOR',
  'ADMINISTRATOR',
] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ACCOUNT_STATUSES = ['ACTIVE', 'HIDDEN', 'SUSPENDED', 'DELETION_PENDING'] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

/** B-5: default is members-only. */
export const PROFILE_VISIBILITIES = ['PUBLIC', 'MEMBERS_ONLY', 'PRIVATE'] as const;
export type ProfileVisibility = (typeof PROFILE_VISIBILITIES)[number];
export const DEFAULT_PROFILE_VISIBILITY: ProfileVisibility = 'MEMBERS_ONLY';

export const CIRCLE_TYPES = ['GEOGRAPHIC', 'THEMATIC'] as const;
export type CircleType = (typeof CIRCLE_TYPES)[number];

export const POST_TYPES = ['DISCUSSION', 'STORY'] as const;
export type PostType = (typeof POST_TYPES)[number];

/** D-4: the seven stages of the Path, in order. */
export const CASE_STAGES = [
  'CONSENT',
  'SITUATION',
  'UNDERSTANDING',
  'INTERESTS',
  'OPTIONS',
  'AGREEMENT',
  'FOLLOW_UP',
] as const;
export type CaseStage = (typeof CASE_STAGES)[number];

export const CASE_STATUSES = [
  'AWAITING_CONSENT',
  'ACTIVE',
  'WITHDRAWN',
  'CLOSED',
  'ROUTED_OUT',
] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

/** D-8: matters that must leave the platform rather than be mediated on it. */
export const OUT_OF_SCOPE_REASONS = [
  'CRIMINAL',
  'DOMESTIC_VIOLENCE',
  'CHILD_SAFETY',
  'THREAT_OF_HARM',
] as const;
export type OutOfScopeReason = (typeof OUT_OF_SCOPE_REASONS)[number];

export const REPORT_REASONS = [
  'DEHUMANIZATION',
  'INCITEMENT',
  'GLORIFICATION_OF_VIOLENCE',
  'HARASSMENT',
  'DOXXING',
  'ARMED_RECRUITMENT',
  'ATROCITY_DENIAL',
  'SPAM',
  'OTHER',
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];
