import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

/**
 * §8 — what a crawler may read is a safety question here, not only an SEO one.
 *
 * The charter, the Wall and the policies should be found by anyone searching.
 * Anything that touches a member must not be: /auth carries one-time tokens in
 * query strings, /members is members-only by default (B-5), and a withdrawal
 * link is a capability — indexing any of them would publish something a member
 * expected to be private.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/*/auth/', '/*/members', '/*/voices/withdraw'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
