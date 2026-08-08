import { createTheme, type Theme } from '@mui/material/styles';
import { getDirection, type Locale } from '@peace/shared';
import { componentDefaults } from './components';
import { darkPalette, lightPalette } from './palette';
import { typographyFor } from './typography';

/**
 * One theme per locale, because direction and typography are locale-dependent
 * (I-2). Light and dark follow the reader's system setting through MUI's CSS
 * variables, so no preference has to be stored — one fewer thing known about a
 * member (S-1).
 */
export function createAppTheme(locale: Locale): Theme {
  return createTheme({
    direction: getDirection(locale),
    cssVariables: { colorSchemeSelector: 'media' },
    colorSchemes: {
      light: { palette: lightPalette },
      dark: { palette: darkPalette },
    },
    typography: typographyFor(locale),
    shape: { borderRadius: 10 },
    spacing: 8,
    components: componentDefaults,
  });
}
