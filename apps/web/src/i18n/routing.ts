import { defineRouting } from 'next-intl/routing';
import { DEFAULT_LOCALE, LOCALES } from '@peace/shared';

/**
 * I-1/I-3 — four launch languages, each with its own path prefix.
 *
 * `localePrefix: 'always'` means no language is the unmarked default: an Arabic
 * reader is at /ar and an English reader at /en, and neither URL is the "real"
 * one with the other as a translation of it (§3.4, no cultural default).
 */
export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'always',
  localeDetection: true,
});
