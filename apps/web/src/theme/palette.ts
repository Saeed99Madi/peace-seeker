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

/** Consumed by PeaceMark, so the logo follows the theme instead of being pinned. */
export const markVariables = {
  light: {
    '--peace-mark-ring': BRAND.olive700,
    '--peace-mark-leaf': BRAND.olive800,
    '--peace-mark-vein': BRAND.gold400,
    '--peace-mark-cream': BRAND.sand50,
  },
  dark: {
    '--peace-mark-ring': BRAND.olive300,
    '--peace-mark-leaf': BRAND.olive600,
    '--peace-mark-vein': BRAND.gold400,
    '--peace-mark-cream': BRAND.night900,
  },
} as const;
