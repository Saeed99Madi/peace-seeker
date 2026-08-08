import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { buildCsp, securityHeaders } from './lib/security-headers';

const handleI18n = createMiddleware(routing);

/**
 * Locale routing, plus the document security headers.
 *
 * The Content-Security-Policy is the point of this file: S-6 forbids
 * third-party trackers, and a policy naming only 'self' is what turns that from
 * a promise in a document into a property of the page. Adding an analytics
 * pixel would mean editing this file, in review, deliberately.
 */
export default function middleware(request: NextRequest) {
  const isProduction = process.env.NODE_ENV === 'production';
  const response = handleI18n(request);

  for (const [name, value] of Object.entries(
    securityHeaders(buildCsp(isProduction), isProduction),
  )) {
    response.headers.set(name, value);
  }
  return response;
}

export const config = {
  // Everything except API routes, Next internals and static files.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
