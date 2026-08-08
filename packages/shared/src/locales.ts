/**
 * Supported locales. Spec I-1 / I-3: language is chosen independently of country
 * and there is no cultural default (§3.4 "one country").
 */
export const LOCALES = ['en', 'ar', 'fr', 'es'] as const;

export type Locale = (typeof LOCALES)[number];

/** Fallback used only when the visitor expresses no preference at all. */
export const DEFAULT_LOCALE: Locale = 'en';

/** Locales rendered right-to-left (spec I-2: full RTL, not a mirrored afterthought). */
export const RTL_LOCALES: readonly Locale[] = ['ar'];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  ar: 'العربية',
  fr: 'Français',
  es: 'Español',
};

/** BCP-47 tags used for Intl formatting. */
export const LOCALE_TAGS: Record<Locale, string> = {
  en: 'en',
  ar: 'ar',
  fr: 'fr',
  es: 'es',
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

export function getDirection(locale: Locale): 'rtl' | 'ltr' {
  return RTL_LOCALES.includes(locale) ? 'rtl' : 'ltr';
}
