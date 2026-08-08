import { notFound } from 'next/navigation';

/**
 * Catch-all for URLs that match no page.
 *
 * Without it, Next serves its own built-in 404 — an unstyled English page with
 * no header, no footer and no way back, shown to an Arabic reader as readily as
 * to an English one. This hands the request to `not-found.tsx`, which is
 * translated and looks like the rest of the platform.
 *
 * A mistyped URL is a small thing. Being answered in a language you do not read
 * by a site that just told you it treats every language equally is not.
 */
export default function CatchAllNotFound() {
  notFound();
}
