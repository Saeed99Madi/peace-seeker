import Container from '@mui/material/Container';
import type { Locale } from '@peace/shared';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { pageMetadata } from '@/lib/site';
import { VerifyMagicLink } from '@/components/auth/VerifyMagicLink';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'membership' });
  // Reached only from a one-time link in an email. Indexing it would publish a
  // capability, so it stays out of search entirely (robots.ts agrees).
  return pageMetadata(locale as Locale, '/auth/verify', {
    title: t('signIn.title'),
    robots: { index: false, follow: false },
  });
}

/** Consumes the one-time link from the member's email and opens a session. */
export default async function VerifyPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  const { token } = await searchParams;
  setRequestLocale(locale);

  return (
    <Container maxWidth="sm" sx={{ py: 10 }}>
      <VerifyMagicLink token={token ?? ''} />
    </Container>
  );
}
