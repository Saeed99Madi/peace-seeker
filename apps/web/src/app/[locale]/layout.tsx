import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import Box from '@mui/material/Box';
import { getDirection, isLocale, LOCALES, type Locale } from '@peace/shared';
import { SITE_URL, url } from '@/lib/site';
import { FoundationSchema } from '@/components/seo/FoundationSchema';
import { onest } from '@/theme/fonts';
import { ThemeRegistry } from '@/theme/ThemeRegistry';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppFooter } from '@/components/layout/AppFooter';
import { SkipLink } from '@/components/layout/SkipLink';

/** Every locale is pre-rendered, so the public pages are static and cacheable. */
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });
  const home = await getTranslations({ locale, namespace: 'home' });

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t('brand.name'), template: `%s — ${t('brand.name')}` },
    description: t('brand.tagline'),
    applicationName: t('brand.name'),
    // No `alternates` here on purpose: a layout does not know which page it is
    // wrapping, so any hreflang it declared would point every page at the
    // locale root — telling a crawler that /en/voices and /ar are the same
    // page. Wrong reciprocal hreflang makes Google discard the annotations
    // altogether, so each page declares its own via pageMetadata(); check-seo
    // fails the build if one forgets.
    // S-6: no social SDKs, but plain Open Graph tags carry no script and make
    // no request to a third party, so a shared link still reads well.
    openGraph: {
      type: 'website',
      siteName: t('brand.name'),
      title: t('brand.name'),
      description: t('brand.tagline'),
      locale,
      alternateLocale: LOCALES.filter((other) => other !== locale),
      url: url(locale as Locale),
      images: [{ url: '/share.png', width: 1200, height: 630, alt: home('mark.alt') }],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('brand.name'),
      description: t('brand.tagline'),
      images: ['/share.png'],
    },
    robots: { index: true, follow: true },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const messages = await getMessages();
  const direction = getDirection(locale as Locale);

  return (
    <html
      lang={locale}
      dir={direction}
      className={direction === 'ltr' ? onest.variable : undefined}
      suppressHydrationWarning
    >
      <body>
        <FoundationSchema
          locale={locale as Locale}
          name={messages.common?.brand?.name as string}
          tagline={messages.common?.brand?.tagline as string}
          foundation={messages.common?.brand?.foundation as string}
        />
        <NextIntlClientProvider messages={messages}>
          <ThemeRegistry locale={locale as Locale}>
            <SkipLink />
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
              <AppHeader locale={locale as Locale} />
              <Box component="main" id="main" sx={{ flex: 1 }}>
                {children}
              </Box>
              <AppFooter />
            </Box>
          </ThemeRegistry>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
