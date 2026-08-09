import { BRAND } from '@/theme/tokens';
import type { Locale } from '@peace/shared';

/**
 * The visual marker beside each language in the switcher.
 *
 * A note on flags, because it is a real decision and not a stylistic one: a
 * flag is a country, and these are languages. Arabic has no country — choosing
 * one for the twenty-odd states that speak it is a political act, and on a
 * platform whose members sit on opposite sides of live conflicts it is the
 * exact act §3.1 forbids. English would have to pick between two flags too.
 *
 * So the badge is the letterform instead: each language marked by a letter only
 * that language uses, in its own colour. It reads at a glance the way a flag
 * does, and it belongs to the language rather than to a state.
 *
 * Set BADGE_STYLE to 'flag' to use national flags instead — everything else
 * keeps working, and the Foundation may decide differently than I have.
 */
export const BADGE_STYLE: 'letter' | 'flag' = 'letter';

export interface LocaleBadge {
  letter: string;
  flag: string;
  fg: string;
  bg: string;
}

export const LOCALE_BADGES: Record<Locale, LocaleBadge> = {
  en: { letter: 'A', flag: '🇬🇧', fg: BRAND.olive900, bg: BRAND.olive100 },
  ar: { letter: 'ع', flag: '🇸🇦', fg: '#5E4620', bg: BRAND.gold200 },
  fr: { letter: 'É', flag: '🇫🇷', fg: '#2F5560', bg: '#D6E6EA' },
  es: { letter: 'Ñ', flag: '🇪🇸', fg: '#7A3B2A', bg: '#F3DCD3' },
};
