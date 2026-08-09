import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@peace/shared';
import { pageMetadata } from '@/lib/site';
import { PageHeading } from '@/components/common/PageHeading';
import { VoiceCounter } from '@/components/voice/VoiceCounter';
import { VoiceWall } from '@/components/voice/VoiceWall';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'voice' });
  return pageMetadata(locale as Locale, '/voices', {
    title: t('wall.title'),
    description: t('wall.subtitle'),
  });
}

export default async function VoicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'voice' });

  return (
    <>
      <PageHeading title={t('wall.title')} subtitle={t('wall.subtitle')} />
      <Container maxWidth="lg" sx={{ pb: 8 }}>
        <Stack spacing={5}>
          <VoiceCounter locale={locale as Locale} />
          <VoiceWall locale={locale as Locale} limit={48} />
        </Stack>
      </Container>
    </>
  );
}
