'use client';

import { useMemo, type ReactNode } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import { getDirection, type Locale } from '@peace/shared';
import { createAppTheme } from './create-theme';

/**
 * I-2 — "complete right-to-left layout support, not a mirrored afterthought".
 *
 * The stylis RTL plugin rewrites every physical property Emotion emits, so
 * padding-left becomes padding-right, margins and borders flip, and MUI's own
 * internals flip with them. Component code is then written once, in logical
 * terms, and is correct in both directions — which is what stops RTL from
 * decaying as features are added.
 */
export function ThemeRegistry({ locale, children }: { locale: Locale; children: ReactNode }) {
  const direction = getDirection(locale);
  const theme = useMemo(() => createAppTheme(locale), [locale]);

  return (
    <AppRouterCacheProvider
      options={{
        key: direction === 'rtl' ? 'muirtl' : 'mui',
        stylisPlugins: direction === 'rtl' ? [prefixer, rtlPlugin] : [],
      }}
    >
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
