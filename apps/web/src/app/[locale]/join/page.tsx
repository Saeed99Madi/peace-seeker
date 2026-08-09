import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@peace/shared';
import { pageMetadata } from '@/lib/site';
import { PageHeading } from '@/components/common/PageHeading';
import { JoinForm } from '@/components/membership/JoinForm';
import { TextLink } from '@/components/common/ButtonLink';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'membership' });
  return pageMetadata(locale as Locale, '/join', {
    title: t('join.title'),
    description: t('join.intro'),
  });
}

export default async function JoinPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'membership' });

  return (
    <>
      <PageHeading maxWidth="sm" title={t('join.title')} />
      <Container maxWidth="sm" sx={{ pb: 8 }}>
        <Stack spacing={3}>
          <JoinForm />
          <TextLink href="/auth/signin" variant="body2">
            {t('join.existing')} {t('signIn.title')}
          </TextLink>
        </Stack>
      </Container>
    </>
  );
}
