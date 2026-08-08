import type { Metadata } from 'next';
import { LOCALES, type Locale } from '@peace/shared';

/**
 * The one canonical origin. Everything else — a second domain, a hyphenated
 * variant, a www prefix — must 301 here, or search engines split the site's
 * standing between them and each ranks worse than one would.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(
  /\/$/,
  '',
);

export const url = (locale: Locale, path = '') => `${SITE_URL}/${locale}${path}`;

/**
 * I-1/I-3 — hreflang, which is the whole SEO story for a four-language site.
 *
 * Without it a crawler sees four pages saying the same thing and picks one,
 * so an Arabic reader searching in Arabic may be shown the English page or
 * nothing. These tags say: same content, four languages, none of them primary.
 *
 * `x-default` points at the language negotiator at the root rather than at
 * English — §3.4 forbids treating any one language as the real one.
 */
export function alternates(path = ''): Metadata['alternates'] {
  return {
    canonical: undefined,
    languages: {
      ...Object.fromEntries(LOCALES.map((locale) => [locale, `/${locale}${path}`])),
      'x-default': path || '/',
    },
  };
}

/** Per-page metadata: canonical for this locale, alternates for the rest. */
export function pageMetadata(locale: Locale, path = '', extra: Metadata = {}): Metadata {
  return {
    ...extra,
    alternates: {
      canonical: url(locale, path),
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [l, url(l, path)])),
        'x-default': `${SITE_URL}${path || '/'}`,
      },
    },
  };
}
