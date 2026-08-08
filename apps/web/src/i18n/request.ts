import { getRequestConfig } from 'next-intl/server';
import { isLocale, DEFAULT_LOCALE, type Locale } from '@peace/shared';
import { loadMessages } from './load-messages';

function lookup(messages: unknown, path: string): string | undefined {
  const value = path
    .split('.')
    .reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], messages);
  return typeof value === 'string' ? value : undefined;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: Locale = isLocale(requested) ? requested : DEFAULT_LOCALE;

  const messages = await loadMessages(locale);
  /**
   * A translator will always be behind the code by a few keys. When that
   * happens the reader must get *words* — the English ones — not a raw key and
   * certainly not a crashed page. next-intl's default is to surface the key
   * path, which is a developer's value in a reader's face.
   */
  const fallback = locale === DEFAULT_LOCALE ? messages : await loadMessages(DEFAULT_LOCALE);

  return {
    locale,
    messages,
    now: new Date(),
    formats: {
      dateTime: {
        long: { dateStyle: 'long' },
        short: { dateStyle: 'medium' },
      },
    },
    onError(error) {
      // Loud in the log, never fatal to the page.
      console.error(`[i18n] ${error.message}`);
    },
    getMessageFallback({ namespace, key }) {
      const path = [namespace, key].filter(Boolean).join('.');
      const english = lookup(fallback, path);
      if (english) return english;
      // Missing in every language: a bug the parity test should have caught.
      // Show developers the path; show a reader nothing rather than gibberish.
      return process.env.NODE_ENV === 'development' ? path : '';
    },
  };
});
