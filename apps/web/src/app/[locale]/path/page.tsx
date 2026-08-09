import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CASE_STAGES, type Locale } from '@peace/shared';
import { pageMetadata } from '@/lib/site';
import { PageHeading } from '@/components/common/PageHeading';

export const revalidate = 3600;

/**
 * Module D, explained before anyone commits to it. D-8 requires the platform to
 * publish a visible statement that it is not a substitute for legal protection
 * or emergency services — so that statement is the first thing on the page,
 * not a footnote at the bottom.
 */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'path' });
  return pageMetadata(locale as Locale, '/path', {
    title: t('title'),
    description: t('intro'),
  });
}

export default async function PathPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'path' });

  return (
    <>
      <PageHeading maxWidth="md" title={t('title')} subtitle={t('subtitle')} />
      <Container maxWidth="md" sx={{ pb: 8 }}>
        <Stack spacing={4}>
          <Alert severity="warning">{t('notLegal')}</Alert>

          <Typography variant="body1" sx={{ maxWidth: '68ch' }}>
            {t('intro')}
          </Typography>

          <Stack spacing={1}>
            <Typography variant="h4" component="h2">
              {t('symmetry.title')}
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: '68ch' }}>
              {t('symmetry.body')}
            </Typography>
          </Stack>

          <Stack spacing={1}>
            <Typography variant="h4" component="h2">
              {t('facilitator.title')}
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: '68ch' }}>
              {t('facilitator.body')}
            </Typography>
          </Stack>

          {/* D-4 — the seven stages, named in order and numbered, because here
              the order is the method rather than a ranking of importance. */}
          <Stack component="ol" spacing={1.5} sx={{ pl: 3, m: 0 }}>
            {CASE_STAGES.map((stage) => (
              <Typography key={stage} component="li" sx={{ maxWidth: '64ch' }}>
                {t(`stages.${stage}`)}
              </Typography>
            ))}
          </Stack>
        </Stack>
      </Container>
    </>
  );
}
