import Container from '@mui/material/Container';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@peace/shared';
import { pageMetadata } from '@/lib/site';
import { PageHeading } from '@/components/common/PageHeading';
import { VoiceForm } from '@/components/voice/VoiceForm';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'voice' });
  return pageMetadata(locale as Locale, '/voices/new', { title: t('form.title') });
}

export default async function AddVoicePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'voice' });

  return (
    <>
      <PageHeading title={t('form.title')} />
      <Container maxWidth="sm" sx={{ pb: 8 }}>
        <VoiceForm />
      </Container>
    </>
  );
}
