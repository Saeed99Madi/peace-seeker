/**
 * The API's *origin*, with any path removed.
 *
 * This must not be the full API URL. A CSP source expression carrying a path is
 * matched exactly unless it ends in "/", so `http://host/api` permits a request
 * to `/api` and refuses `/api/voices` — which silently blocked every call the
 * browser made. Caught in the browser with the policy enforced; a header that
 * merely looks correct is not evidence.
 */
function apiOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (!raw) return '';
  try {
    return new URL(raw).origin;
  } catch {
    return '';
  }
}

const API_ORIGIN = apiOrigin();

/**
 * S-6 / S-11 — the response headers for every document.
 *
 * Kept in one file so the policy can be read as a whole, and so a change to it
 * shows up in review as a change to the platform's security posture rather than
 * as a line buried in routing code.
 */
export function buildCsp(isProduction: boolean): string {
  return [
    `default-src 'self'`,
    /**
     * A documented trade-off, not an oversight.
     *
     * The strong form of this directive is a per-request nonce with
     * 'strict-dynamic'. It cannot be used here: the public pages are
     * statically prerendered so they can be served from a CDN and survive load
     * spikes (§7), and static HTML is written at build time — there is no
     * per-request value to stamp into it. Verified empirically: with a nonce,
     * no nonce attribute reaches the HTML and every script on the page is
     * blocked.
     *
     * What limits the damage instead is the rest of this policy. React escapes
     * all rendered content, and no off-origin host is reachable by any
     * directive — script, connect, frame, form-action and base-uri are all
     * 'self' or 'none'. An injected script would therefore have nowhere to send
     * what it stole, which on this platform is the consequence that matters.
     *
     * To upgrade: make the document routes dynamic and restore the nonce. That
     * trades the CDN guarantee in §7 for it, and is the Foundation's call.
     */
    `script-src 'self' 'unsafe-inline'${isProduction ? '' : " 'unsafe-eval'"}`,
    // Emotion writes styles into <style> tags at runtime, so inline styles must
    // be allowed; no external stylesheet host is.
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob:`,
    [`media-src 'self' blob:`, API_ORIGIN].filter(Boolean).join(' '),
    `font-src 'self'`,
    [`connect-src 'self'`, API_ORIGIN].filter(Boolean).join(' '),
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `base-uri 'none'`,
    `object-src 'none'`,
    ...(isProduction ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
}

export function securityHeaders(csp: string, isProduction: boolean): Record<string, string> {
  return {
    'Content-Security-Policy': csp,
    'X-Content-Type-Options': 'nosniff',
    // S-3 — a referrer leaks which page a member was reading to every site they
    // click through to. On this platform that is a disclosure, not telemetry.
    'Referrer-Policy': 'no-referrer',
    'X-Frame-Options': 'DENY',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Permissions-Policy':
      'geolocation=(), microphone=(self), camera=(self), browsing-topics=(), interest-cohort=()',
    ...(isProduction
      ? { 'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload' }
      : {}),
  };
}
