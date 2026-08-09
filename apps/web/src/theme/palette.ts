import type { PaletteOptions } from '@mui/material/styles';
import { BRAND } from './tokens';

/**
 * Light and dark are two readings of the same palette, not two designs. Every
 * token below has a counterpart, so a component written once is correct in both
 * — including the mark, whose three colours are published as CSS variables.
 */
export const lightPalette: PaletteOptions = {
  mode: 'light',
  primary: {
    main: BRAND.olive700,
    light: BRAND.olive500,
    dark: BRAND.olive900,
    contrastText: BRAND.sand50,
  },
  secondary: {
    main: BRAND.gold700,
    light: BRAND.gold500,
    dark: '#6E5324',
    contrastText: BRAND.sand50,
  },
  background: { default: BRAND.sand50, paper: '#FFFFFF' },
  text: { primary: BRAND.olive950, secondary: '#5B5F52' },
  divider: 'rgba(30, 38, 25, 0.14)',
  // Muted status colours: on this platform an error is usually a person being
  // told "not yet", and a shouting red is the wrong register for that.
  error: { main: BRAND.clay600 },
  warning: { main: BRAND.gold700 },
  info: { main: BRAND.teal600 },
  success: { main: BRAND.olive700 },
};

export const darkPalette: PaletteOptions = {
  mode: 'dark',
  primary: {
    main: BRAND.olive300,
    light: BRAND.olive100,
    dark: BRAND.olive600,
    contrastText: BRAND.night900,
  },
  secondary: {
    main: BRAND.gold400,
    light: BRAND.gold200,
    dark: BRAND.gold600,
    contrastText: BRAND.night900,
  },
  background: { default: BRAND.night900, paper: BRAND.night800 },
  text: { primary: '#F2EFE6', secondary: '#ADA895' },
  divider: 'rgba(242, 239, 230, 0.16)',
  error: { main: BRAND.clay400 },
  warning: { main: BRAND.gold400 },
  info: { main: BRAND.teal400 },
  success: { main: BRAND.olive300 },
};

/**
 * Values that vary by colour scheme but are used outside MUI's palette — the
 * mark's three colours, and the hero's gradient.
 *
 * They are CSS variables rather than values chosen in JavaScript because the
 * components using them are server-rendered, and a function that picks a colour
 * cannot cross the server/client boundary. Declaring both schemes here also
 * makes the pairing reviewable in one place: the hero once had a hard-coded
 * light gradient while the text followed the dark palette, and a reader in dark
 * mode got pale text on a pale ground.
 */
export const schemeVariables = {
  light: {
    '--peace-mark-ring': BRAND.olive700,
    '--peace-mark-leaf': BRAND.olive800,
    '--peace-mark-vein': BRAND.gold400,
    '--peace-mark-cream': BRAND.sand50,
    '--peace-hero-bg': `radial-gradient(58% 62% at 16% 4%, ${BRAND.olive100} 0%, transparent 64%),
      radial-gradient(52% 58% at 86% 14%, ${BRAND.gold200} 0%, transparent 66%),
      linear-gradient(180deg, ${BRAND.sand100} 0%, ${BRAND.sand50} 78%)`,
    '--peace-glyph-bg': `radial-gradient(72% 72% at 34% 24%, ${BRAND.sand50} 0%, ${BRAND.olive100} 74%, ${BRAND.gold200} 100%)`,
  },
  dark: {
    '--peace-mark-ring': BRAND.olive300,
    '--peace-mark-leaf': BRAND.olive600,
    '--peace-mark-vein': BRAND.gold400,
    '--peace-mark-cream': BRAND.night900,
    '--peace-hero-bg': `radial-gradient(58% 62% at 16% 4%, ${BRAND.olive900} 0%, transparent 64%),
      radial-gradient(52% 58% at 86% 14%, ${BRAND.gold700}55 0%, transparent 66%),
      linear-gradient(180deg, ${BRAND.night800} 0%, ${BRAND.night900} 78%)`,
    '--peace-glyph-bg': `radial-gradient(72% 72% at 34% 24%, ${BRAND.night800} 0%, ${BRAND.olive900} 76%, ${BRAND.gold700}66 100%)`,
  },
} as const;

/** @deprecated kept as an alias while call sites migrate. */
export const markVariables = schemeVariables;
