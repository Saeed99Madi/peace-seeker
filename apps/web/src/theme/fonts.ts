import localFont from 'next/font/local';

/**
 * Onest, self-hosted.
 *
 * Self-hosted and not loaded from Google's CDN, because a webfont request is a
 * request to a third party: it would hand Google the IP address of every reader
 * on every page load. S-6 forbids that, and on this platform it is not a
 * theoretical objection — some of these readers are people whose visits should
 * not be logged by anyone.
 *
 * One file, the `latin` subset, 31.5 KB for the whole 100–900 weight range.
 * Verified against the catalogues: English, French and Spanish are covered
 * completely by it, so the latin-ext subset is not shipped. Turkish (Phase 2)
 * will need it; `onest-latin-ext.woff2` is kept alongside for that day.
 *
 * Onest has no Arabic. That is not a gap to work around — a Latin geometric
 * sans has nothing to say about Naskh, and Arabic keeps its own stack in
 * typography.ts. §3.4 means the Arabic reader gets a face chosen for Arabic,
 * not a fallback from a face chosen for English.
 */
export const onest = localFont({
  src: [{ path: '../fonts/onest-latin.woff2', weight: '100 900', style: 'normal' }],
  variable: '--font-onest',
  // The system stack renders immediately and Onest swaps in when it arrives, so
  // a reader on a slow connection sees words rather than blank space (§7).
  display: 'swap',
  preload: true,
  fallback: [
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
  ],
  adjustFontFallback: 'Arial',
});
