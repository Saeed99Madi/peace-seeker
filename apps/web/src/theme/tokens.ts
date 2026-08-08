/**
 * The palette is derived from the mark, and belongs to no flag.
 *
 * §3.1 rules colour before it rules anything else: a logo or a page built from
 * the greens-reds-blacks-whites of national and factional symbols takes a side
 * before a word is read. What is left, and what this uses, is older than any of
 * them — the olive, the gold of light on it, the sand it grows in.
 */
export const BRAND = {
  /** Olive: the two parties, and the leaf they make together. */
  olive950: '#1E2619',
  olive900: '#2E3A28',
  olive800: '#3B4A34',
  olive700: '#4F6146',
  olive600: '#5A6B4A',
  olive500: '#6B8159',
  olive300: '#A3B48F',
  olive100: '#DDE4D2',

  /** Gold: the venation — the nerve inside the leaf. Light, not wealth. */
  gold700: '#8A6A2F',
  gold600: '#A9843F',
  gold500: '#C9A063',
  gold400: '#D8B87A',
  gold200: '#EBDCBB',

  /** Sand: the ground. */
  sand50: '#FAF8F3',
  sand100: '#F4F0E7',
  sand200: '#E8E1D3',
  sand300: '#D6CCB8',

  /** Night: the dark theme's ground. */
  night900: '#141310',
  night800: '#1C1B16',
  night700: '#26241D',
  night600: '#35322A',

  /** Two quiet accents, for status and for variety. Neither is a flag colour. */
  teal600: '#3F6670',
  teal400: '#7FA3AB',
  clay600: '#A4553C',
  clay400: '#CE8B75',
} as const;

/**
 * A modular type scale (1.25) expressed in rem, with fluid clamps for the two
 * display sizes. Fixed steps rather than ad-hoc sizes are what make a page look
 * composed rather than assembled.
 */
export const TYPE_SCALE = {
  display: 'clamp(2.75rem, 1.6rem + 5.2vw, 5rem)',
  h1: 'clamp(2rem, 1.3rem + 3vw, 3.25rem)',
  h2: 'clamp(1.6rem, 1.2rem + 1.7vw, 2.25rem)',
  h3: '1.6rem',
  h4: '1.28rem',
  h5: '1.125rem',
  h6: '1rem',
  body: '1.0625rem',
  small: '0.9375rem',
  caption: '0.8125rem',
  overline: '0.75rem',
} as const;

/** Vertical rhythm. Sections breathe on one scale, not on whatever felt right. */
export const RHYTHM = {
  sectionY: { xs: 7, md: 12 },
  sectionYTight: { xs: 5, md: 8 },
  stack: { xs: 3, md: 4 },
  /** Prose never runs wider than this, in any script. */
  proseWidth: '66ch',
  contentWidth: 1180,
} as const;

/** One elevation language: hairline borders and one soft shadow. No drop shadows stacked for drama. */
export const SURFACE = {
  radius: 14,
  radiusSmall: 9,
  radiusPill: 999,
  shadowSoft: '0 1px 2px rgba(30, 38, 25, 0.04), 0 8px 24px -12px rgba(30, 38, 25, 0.18)',
  shadowLifted: '0 2px 4px rgba(30, 38, 25, 0.06), 0 18px 48px -20px rgba(30, 38, 25, 0.28)',
} as const;
