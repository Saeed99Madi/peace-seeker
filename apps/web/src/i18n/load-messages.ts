import type { AbstractIntlMessages } from 'next-intl';
import { DEFAULT_LOCALE, type Locale } from '@peace/shared';

/**
 * Catalogues are split by namespace so that no translation file grows past the
 * project's 200-line ceiling, and so a translator can be given one subject at a
 * time rather than one enormous file.
 */
const NAMESPACES = [
  'common',
  'home',
  'charter',
  'voice',
  'membership',
  'community',
  'path',
  'policy',
  'admin',
] as const;

async function loadNamespace(locale: string, namespace: string): Promise<AbstractIntlMessages> {
  try {
    return (await import(`../../messages/${locale}/${namespace}.json`)).default;
  } catch {
    // A missing namespace falls back to the default locale rather than showing
    // a raw key. A half-translated page is usable; a page of dotted keys is not.
    return (await import(`../../messages/${DEFAULT_LOCALE}/${namespace}.json`)).default;
  }
}

export async function loadMessages(locale: Locale): Promise<AbstractIntlMessages> {
  const loaded = await Promise.all(
    NAMESPACES.map(async (namespace) => [namespace, await loadNamespace(locale, namespace)] as const),
  );
  return Object.fromEntries(loaded);
}
