import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@peace/shared';
import { pageMetadata } from '@/lib/site';
import { PageHeading } from '@/components/common/PageHeading';
import { VisionStatements } from '@/components/charter/VisionStatements';

export const revalidate = 3600;

const PRINCIPLES = ['symmetry', 'dignity', 'safety', 'oneCountry'] as const;

/**
 * §2 — the Founding Vision, published in every supported language and linked
 * from every page. This is the normative reference for every other decision on
 * the platform, so it is given a page of its own rather than a paragraph.
 */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'charter' });
  return pageMetadata(locale as Locale, '/charter', { title: t('title') });
}

export default async function CharterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'charter' });

  return (
    <>
      <PageHeading title={t('title')} subtitle={t('subtitle')} />

      <Container maxWidth="md" sx={{ pb: 8 }}>
        <Stack spacing={5}>
          <Stack spacing={2}>
            <Typography variant="h2" component="h2">
              {t('peace.heading')}
            </Typography>
            <Typography variant="h4" component="p" sx={{ fontWeight: 400 }}>
              {t('peace.definition')}
            </Typography>
            <Typography variant="h5" component="p" sx={{ fontWeight: 400 }}>
              {t('peace.submission')}
            </Typography>
            <Typography variant="body1" sx={{ maxWidth: '65ch' }}>
              {t('peace.basis')}
            </Typography>
          </Stack>

          <Divider />
          <VisionStatements locale={locale as Locale} />
          <Divider />

          <Stack spacing={2}>
            <Typography variant="h2" component="h2">
              {t('membership.heading')}
            </Typography>
            <Typography variant="h5" component="p" sx={{ fontWeight: 400 }}>
              {t('membership.requirement')}
            </Typography>
          </Stack>

          <Divider />

          <Stack spacing={4}>
            <Typography variant="h2" component="h2">
              {t('principles.heading')}
            </Typography>
            {PRINCIPLES.map((principle) => (
              <Stack key={principle} spacing={1}>
                <Typography variant="h4" component="h3">
                  {t(`principles.${principle}.title`)}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '68ch' }}>
                  {t(`principles.${principle}.body`)}
                </Typography>
              </Stack>
            ))}
          </Stack>

          {/* I-6 — this text is never machine-translated, and the reader is told so. */}
          <Typography variant="caption" color="text.secondary">
            {t('translationNote')}
          </Typography>
        </Stack>
      </Container>
    </>
  );
}
