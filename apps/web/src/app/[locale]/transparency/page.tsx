import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@peace/shared';
import { pageMetadata } from '@/lib/site';
import { PageHeading } from '@/components/common/PageHeading';

export const revalidate = 3600;

const STATEMENTS = ['hosting', 'requests', 'noTrackers', 'logs'] as const;

/** S-8 — a published statement of how the Foundation answers data requests. */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'policy' });
  return pageMetadata(locale as Locale, '/transparency', { title: t('transparency.title') });
}

export default async function TransparencyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'policy' });

  return (
    <>
      <PageHeading title={t('transparency.title')} />
      <Container maxWidth="md" sx={{ pb: 8 }}>
        <Stack spacing={3}>
          {STATEMENTS.map((statement) => (
            <Typography key={statement} color="text.secondary" sx={{ maxWidth: '68ch' }}>
              {t(`transparency.${statement}`)}
            </Typography>
          ))}
        </Stack>
      </Container>
    </>
  );
}
