/**
 * §2 — the Founding Vision is the normative reference for every product,
 * design and moderation decision.
 *
 * The *text* itself lives in the translation catalogues (apps/web/messages/
 * <locale>/charter.json) because I-6 requires every translation of it to be
 * reviewed by a human translator. What lives here is the version identifier
 * that membership affirmations are recorded against (B-4), so the Foundation
 * can always tell which wording a given member actually affirmed.
 */
export const CHARTER_VERSION = '1.0.0';

/** The seven statements of the vision, as stable keys for the catalogues. */
export const VISION_KEYS = [
  'creation',
  'nerveCell',
  'purpose',
  'religionAndScience',
  'humanity',
  'oneCountry',
  'shortLife',
] as const;

export type VisionKey = (typeof VISION_KEYS)[number];

/** The single membership requirement, per the charter. */
export const MEMBERSHIP_REQUIREMENT = 'self-introduction' as const;
