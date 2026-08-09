import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@peace/shared';
import { pageMetadata } from '@/lib/site';
import { PageHeading } from '@/components/common/PageHeading';
import { AdminGate } from '@/components/admin/AdminGate';
import { AdminVoiceList } from '@/components/admin/AdminVoiceList';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin' });
  // Never indexed, in step with robots.ts: this page lists member content
  // alongside the real names behind anonymous voices.
  return pageMetadata(locale as Locale, '/admin', {
    title: t('title'),
    robots: { index: false, follow: false },
  });
}

/**
 * E-1 — the moderation surface.
 *
 * It exists because the alternative was editing the database by hand, which
 * leaves no audit trail and no record of which rule was applied. Every action
 * taken here goes through the same decision path as any other moderation
 * (M-2), and the log of it cannot be rewritten (the audit tables reject UPDATE
 * and DELETE at the database).
 */
export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'admin' });

  return (
    <>
      <PageHeading maxWidth="md" title={t('title')} subtitle={t('intro')} />
      <Container maxWidth="md" sx={{ pb: 8 }}>
        <AdminGate>
          <Stack spacing={3}>
            <Alert severity="warning">{t('voices.intro')}</Alert>
            <AdminVoiceList />
          </Stack>
        </AdminGate>
      </Container>
    </>
  );
}
