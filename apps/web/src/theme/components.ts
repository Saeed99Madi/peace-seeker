import type { ThemeOptions } from '@mui/material/styles';
import { schemeVariables } from './palette';
import { SURFACE } from './tokens';

/**
 * Component defaults that encode the design principles rather than a taste.
 *
 * WCAG 2.1 AA (§7) is the reason for the visible focus ring and the 44px
 * minimum target. §3.2 is the reason nothing here grows, glows or animates to
 * pull at the reader: no hover lift, no attention-seeking motion.
 */
export const componentDefaults: ThemeOptions['components'] = {
  MuiCssBaseline: {
    styleOverrides: {
      ':root': schemeVariables.light,
      // The toggle wins in both directions; the media query covers 'system'.
      '@media (prefers-color-scheme: dark)': {
        ':root:not([data-mui-color-scheme="light"])': schemeVariables.dark,
      },
      ':root[data-mui-color-scheme="dark"]': schemeVariables.dark,
      '@media (prefers-reduced-motion: reduce)': {
        '*, *::before, *::after': {
          animationDuration: '0.01ms !important',
          animationIterationCount: '1 !important',
          transitionDuration: '0.01ms !important',
          scrollBehavior: 'auto !important',
        },
      },
      body: { textRendering: 'optimizeLegibility', WebkitFontSmoothing: 'antialiased' },
      /**
       * §7, Bandwidth — "a low-data mode that suppresses images and media
       * autoplay". A reader who has asked their browser or operating system to
       * save data gets the page without a single photograph downloaded: the
       * rule collapses the element, so the browser never fetches its source.
       */
      '@media (prefers-reduced-data: reduce)': {
        '.photo': { display: 'none' },
        'video, audio': { display: 'none' },
      },
      '::selection': { background: 'var(--peace-mark-vein)', color: '#1E2619' },
      // Arabic numerals in a Latin page and vice versa should not jitter as the
      // counter ticks; tabular figures keep the digits on one grid.
      '.tabular': { fontVariantNumeric: 'tabular-nums' },
    },
  },
  MuiButton: {
    defaultProps: { disableElevation: true, disableRipple: false },
    styleOverrides: {
      root: {
        borderRadius: SURFACE.radiusPill,
        minHeight: 46,
        paddingInline: 24,
        transition: 'background-color .18s ease, border-color .18s ease, color .18s ease',
        '&:focus-visible': { outline: '3px solid currentColor', outlineOffset: 3 },
      },
      sizeLarge: { minHeight: 54, paddingInline: 32, fontSize: '1rem' },
      outlined: { borderWidth: 1.5, '&:hover': { borderWidth: 1.5 } },
    },
  },
  MuiTextField: { defaultProps: { variant: 'outlined', fullWidth: true } },
  MuiOutlinedInput: {
    styleOverrides: { root: { borderRadius: SURFACE.radiusSmall } },
  },
  MuiCard: {
    defaultProps: { elevation: 0 },
    styleOverrides: {
      root: ({ theme }) => ({
        border: `1px solid ${(theme.vars ?? theme).palette.divider}`,
        borderRadius: SURFACE.radius,
        backgroundImage: 'none',
      }),
    },
  },
  MuiLink: {
    defaultProps: { underline: 'hover' },
    styleOverrides: {
      root: {
        textUnderlineOffset: '0.22em',
        '&:focus-visible': { outline: '3px solid currentColor', outlineOffset: 3 },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: { borderRadius: SURFACE.radiusSmall, fontWeight: 500 },
      outlined: ({ theme }) => ({ borderColor: (theme.vars ?? theme).palette.divider }),
    },
  },
  MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { root: { backgroundImage: 'none' } } },
  MuiDivider: { styleOverrides: { root: { borderColor: 'var(--mui-palette-divider)' } } },
  MuiAppBar: {
    defaultProps: { elevation: 0, color: 'transparent' },
    styleOverrides: {
      root: ({ theme }) => ({
        // (theme.vars ?? theme) is required wherever cssVariables is enabled:
        // theme.palette.* would freeze the light value into the stylesheet, and
        // the header would stay light while the text went pale in dark mode.
        borderBottom: `1px solid ${(theme.vars ?? theme).palette.divider}`,
        backgroundColor: (theme.vars ?? theme).palette.background.default,
        backdropFilter: 'saturate(140%) blur(8px)',
      }),
    },
  },
  MuiContainer: { defaultProps: { maxWidth: 'lg' } },
};
