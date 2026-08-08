import type { ThemeOptions } from '@mui/material/styles';
import { getDirection, type Locale } from '@peace/shared';
import { TYPE_SCALE } from './tokens';

/**
 * I-2 — Arabic is not Latin text in another alphabet. Naskh needs more vertical
 * room and a slightly larger optical size to stay legible, and it must not be
 * letter-spaced or set in small caps, both of which break the joins between
 * letters. Every rule below that differs between the two scripts differs for
 * that kind of reason, not for taste.
 *
 * Both stacks are system fonts: a web font is a request to a third party (S-6)
 * and 40–120 KB on a 3G connection (§7).
 */
/**
 * Onest for the Latin languages, via the CSS variable next/font exposes, with
 * the system stack behind it for the moment before the file lands.
 */
const LATIN = [
  'var(--font-onest)',
  '-apple-system',
  'BlinkMacSystemFont',
  '"Segoe UI"',
  'Roboto',
  '"Helvetica Neue"',
  'Arial',
  'sans-serif',
].join(', ');

const ARABIC = [
  '"SF Arabic"',
  '"Geeza Pro"',
  '"Noto Naskh Arabic"',
  '"Segoe UI"',
  'Tahoma',
  'sans-serif',
].join(', ');

/**
 * Naskh sits smaller on the line than Latin at the same nominal size, so a
 * heading set at 1.28rem reads noticeably quieter in Arabic than in English.
 * A single optical multiplier keeps the two versions of a page equal in weight
 * — which on this platform is not only a typographic concern (§3.4).
 */
const OPTICAL_RTL = 1.07;

function scale(size: string, rtl: boolean): string {
  if (!rtl || !size.endsWith('rem')) return size;
  return `${(parseFloat(size) * OPTICAL_RTL).toFixed(3)}rem`;
}

export function typographyFor(locale: Locale): ThemeOptions['typography'] {
  const rtl = getDirection(locale) === 'rtl';
  const fontFamily = rtl ? ARABIC : LATIN;
  const s = (size: string) => scale(size, rtl);

  // Headline tracking tightens optically as size grows — but only in Latin.
  const tight = rtl ? 0 : '-0.021em';
  const headingLeading = rtl ? 1.42 : 1.12;
  const bodyLeading = rtl ? 1.95 : 1.68;

  const heading = (fontSize: string, weight = 600, extra = {}) => ({
    fontFamily,
    fontSize,
    fontWeight: weight,
    lineHeight: headingLeading,
    letterSpacing: tight,
    ...extra,
  });

  return {
    fontFamily,
    htmlFontSize: 16,
    fontSize: rtl ? 15.5 : 14.5,
    h1: heading(TYPE_SCALE.h1, 640),
    h2: heading(TYPE_SCALE.h2, 640),
    h3: heading(s(TYPE_SCALE.h3), 620, { lineHeight: rtl ? 1.5 : 1.24 }),
    h4: heading(s(TYPE_SCALE.h4), 620, { lineHeight: rtl ? 1.6 : 1.32, letterSpacing: 0 }),
    h5: heading(s(TYPE_SCALE.h5), 600, { lineHeight: rtl ? 1.7 : 1.4, letterSpacing: 0 }),
    h6: heading(s(TYPE_SCALE.h6), 600, { lineHeight: rtl ? 1.75 : 1.45, letterSpacing: 0 }),
    subtitle1: { fontFamily, fontSize: s(TYPE_SCALE.h5), fontWeight: 500, lineHeight: rtl ? 1.8 : 1.5 },
    subtitle2: { fontFamily, fontSize: s(TYPE_SCALE.small), fontWeight: 600, lineHeight: rtl ? 1.8 : 1.5 },
    body1: { fontFamily, fontSize: s(TYPE_SCALE.body), lineHeight: bodyLeading },
    body2: { fontFamily, fontSize: s(TYPE_SCALE.small), lineHeight: bodyLeading },
    button: { fontFamily, fontSize: s(TYPE_SCALE.small), fontWeight: 600, textTransform: 'none', letterSpacing: 0 },
    caption: { fontFamily, fontSize: s(TYPE_SCALE.caption), lineHeight: rtl ? 1.85 : 1.55 },
    overline: {
      fontFamily,
      fontSize: s(TYPE_SCALE.overline),
      fontWeight: 700,
      lineHeight: 1.6,
      // Tracking and uppercasing are Latin typographic devices; applying them to
      // Arabic would break the letter joins and render the word unreadable.
      letterSpacing: rtl ? 0 : '0.13em',
      textTransform: rtl ? 'none' : 'uppercase',
    },
  };
}
