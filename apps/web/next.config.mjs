import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // `next build` and `next dev` both write here. Pointing the production build
  // at its own directory means running a build never pulls the chunks out from
  // under a dev server that is already serving them.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Traces the files actually reached at runtime, so the production image
  // carries neither the build toolchain nor the rest of the monorepo.
  output: 'standalone',
  outputFileTracingRoot: new URL('../../', import.meta.url).pathname,
  // MUI ships a large number of small modules; this keeps the client bundle
  // near the 300 KB landing-page budget (§7, Bandwidth).
  modularizeImports: {
    '@mui/icons-material': {
      transform: '@mui/icons-material/{{member}}',
    },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // S-6 — no third-party trackers. The policy below permits no
          // off-origin script, frame, or connection at all, so an analytics
          // pixel cannot be added without this file changing in review.
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(self), camera=(self), interest-cohort=()',
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
