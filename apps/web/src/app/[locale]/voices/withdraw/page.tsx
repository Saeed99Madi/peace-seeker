import Container from '@mui/material/Container';
import type { Locale } from '@peace/shared';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { pageMetadata } from '@/lib/site';
import { PageHeading } from '@/components/common/PageHeading';
import { WithdrawVoice } from '@/components/voice/WithdrawVoice';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'voice' });
  // Reached only from a one-time link in an email. Indexing it would publish a
  // capability, so it stays out of search entirely (robots.ts agrees).
  return pageMetadata(locale as Locale, '/voices/withdraw', {
    title: t('withdraw.title'),
    robots: { index: false, follow: false },
  });
}

/** A-9 — one click, from a link, with no account and no sign-in. */
export default async function WithdrawPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  const { token } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'voice' });

  return (
    <>
      <PageHeading title={t('withdraw.title')} subtitle={t('withdraw.body')} />
      <Container maxWidth="sm" sx={{ pb: 8 }}>
        <WithdrawVoice token={token ?? ''} />
      </Container>
    </>
  );
}
