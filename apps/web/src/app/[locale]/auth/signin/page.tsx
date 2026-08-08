import Container from '@mui/material/Container';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@peace/shared';
import { pageMetadata } from '@/lib/site';
import { PageHeading } from '@/components/common/PageHeading';
import { SignInForm } from '@/components/auth/SignInForm';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'membership' });
  // Behind sign-in or holding one-time tokens — kept out of the index, in step
  // with robots.ts, so nothing a member expects to be private gets crawled.
  return pageMetadata(locale as Locale, '/auth/signin', {
    title: t('signIn.title'),
    robots: { index: false, follow: true },
  });
}

export default async function SignInPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'membership' });

  return (
    <>
      <PageHeading title={t('signIn.title')} />
      <Container maxWidth="sm" sx={{ pb: 8 }}>
        <SignInForm />
      </Container>
    </>
  );
}
