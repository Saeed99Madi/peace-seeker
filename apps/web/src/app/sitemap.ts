import type { MetadataRoute } from 'next';
import { LOCALES } from '@peace/shared';
import { SITE_URL } from '@/lib/site';

/**
 * Every public page, in every language, each listing the others as alternates.
 *
 * The pages behind sign-in are deliberately absent: a member directory that
 * defaults to members-only (B-5) has no business in a crawler's index, and
 * neither does anything under /auth.
 */
const PAGES: Array<{ path: string; priority: number; changeFrequency: 'daily' | 'weekly' | 'monthly' }> = [
  { path: '', priority: 1, changeFrequency: 'daily' },
  { path: '/charter', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/voices', priority: 0.9, changeFrequency: 'daily' },
  { path: '/voices/new', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/join', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/path', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/circles', priority: 0.6, changeFrequency: 'weekly' },
  { path: '/conduct', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/safety', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/transparency', priority: 0.5, changeFrequency: 'monthly' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.flatMap((page) =>
    LOCALES.map((locale) => ({
      url: `${SITE_URL}/${locale}${page.path}`,
      lastModified: new Date(),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: {
        languages: Object.fromEntries(
          LOCALES.map((other) => [other, `${SITE_URL}/${other}${page.path}`]),
        ),
      },
    })),
  );
}
