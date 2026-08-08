import { COUNTRY_CODES, type CountryCode, type Locale } from '@peace/shared';

export interface CountryOption {
  code: CountryCode;
  label: string;
}

/**
 * I-5 — every country is named in the reader's own language, and the list is
 * sorted by that language's collation rather than by an English alphabet. No
 * country is pinned to the top, and there is no "popular countries" section:
 * on this platform, a list order is a statement.
 */
export function countryOptions(locale: Locale): CountryOption[] {
  const names = new Intl.DisplayNames([locale], { type: 'region' });
  const collator = new Intl.Collator(locale);

  return COUNTRY_CODES.map((code) => ({ code, label: names.of(code) ?? code }))
    .sort((a, b) => collator.compare(a.label, b.label));
}

export function countryName(code: string | null | undefined, locale: Locale): string | null {
  if (!code) return null;
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}
