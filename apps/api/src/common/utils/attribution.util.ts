import type { VoiceDisplayMode } from '@peace/shared';

/**
 * A-6 — the attribution string shown on the Wall of Voices.
 *
 * The country is rendered by the client from an ISO code, so the strings this
 * function produces carry a placeholder rather than a country name; that keeps
 * every country named in the reader's own language (I-4/I-5) and keeps this
 * function free of any language of its own.
 */
export interface Attribution {
  /** 'name' | 'firstName' | 'anonymousFromCountry' | 'anonymous' */
  kind: 'name' | 'firstName' | 'anonymousFromCountry' | 'anonymous';
  value: string | null;
}

/**
 * Extracts a first name without assuming a first/last structure (I-5): for a
 * single-token name, or a script that does not separate given names, the whole
 * string is returned unchanged.
 */
export function firstNameOf(displayName: string): string {
  const trimmed = displayName.trim();
  const separator = trimmed.search(/\s/);
  return separator === -1 ? trimmed : trimmed.slice(0, separator);
}

export function attributionFor(
  displayName: string,
  mode: VoiceDisplayMode,
  country: string | null,
): Attribution {
  switch (mode) {
    case 'NAME':
      return { kind: 'name', value: displayName };
    case 'FIRST_NAME':
      return { kind: 'firstName', value: firstNameOf(displayName) };
    case 'ANONYMOUS':
    default:
      return country
        ? { kind: 'anonymousFromCountry', value: country }
        : { kind: 'anonymous', value: null };
  }
}

/**
 * A-7 — what a shareable card is permitted to contain. Location and full name
 * appear only when the author explicitly chose that attribution mode.
 */
export function cardSafeFields(attribution: Attribution): { name: string | null; country: string | null } {
  if (attribution.kind === 'name') return { name: attribution.value, country: null };
  if (attribution.kind === 'firstName') return { name: attribution.value, country: null };
  if (attribution.kind === 'anonymousFromCountry') return { name: null, country: attribution.value };
  return { name: null, country: null };
}
