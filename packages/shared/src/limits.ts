/**
 * Hard limits taken directly from the requirements specification.
 * They live here so the API and the UI can never drift apart — a mismatch
 * between the two would break the symmetry guarantees of §3.1.
 */

export const VOICE_LIMITS = {
  /** A-1: display name may be a first name or a pseudonym. */
  displayNameMin: 1,
  displayNameMax: 60,
  /** A-2: optional free-text answer to "Why do you choose peace?". */
  messageMax: 280,
  /** A-3: short spoken/filmed testimony. */
  mediaMaxSeconds: 60,
  mediaMaxBytes: 25 * 1024 * 1024,
} as const;

export const MEMBER_LIMITS = {
  displayNameMin: 1,
  displayNameMax: 60,
  /** B-1: the self-introduction is the single substantive membership requirement. */
  introductionMin: 100,
  introductionMax: 2000,
  passwordMin: 12,
  passwordMax: 128,
  maxLanguages: 10,
  maxSkills: 12,
  maxLinks: 5,
} as const;

export const COMMUNITY_LIMITS = {
  circleNameMax: 80,
  circleDescriptionMax: 1000,
  postTitleMax: 160,
  discussionBodyMax: 8000,
  storyBodyMax: 40000,
  messageBodyMax: 5000,
} as const;

/**
 * D-3: both parties get identical word limits and identical response windows
 * at every stage. One table, applied to both sides, with no per-party override.
 */
export const PATH_LIMITS = {
  statementWordsMax: 600,
  statementsPerStage: 1,
  responseWindowHours: 72,
  followUpDays: [30, 90],
  intakeHopeMax: 1500,
  intakeOfferMax: 1500,
  intakeSituationMax: 4000,
} as const;

export const UPLOAD_LIMITS = {
  imageMaxBytes: 5 * 1024 * 1024,
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
  allowedMediaTypes: ['audio/mpeg', 'audio/mp4', 'audio/webm', 'video/mp4', 'video/webm'] as const,
} as const;

/** S-7: IP addresses are hashed and kept only for abuse mitigation. */
export const RETENTION = {
  hashedIpDays: 7,
  deletionCompletionDays: 30,
  withdrawalTokenDays: 3650,
} as const;
