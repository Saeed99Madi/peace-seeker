import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@peace/shared';
import { pageMetadata } from '@/lib/site';
import { PageHeading } from '@/components/common/PageHeading';

export const revalidate = 3600;

const RULES = [
  'dehumanization',
  'incitement',
  'glorification',
  'harassment',
  'doxxing',
  'recruitment',
  'denial',
] as const;

/** M-1 — a published Code of Conduct derived from the charter. */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'policy' });
  return pageMetadata(locale as Locale, '/conduct', { title: t('conduct.title') });
}

export default async function ConductPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'policy' });

  return (
    <>
      <PageHeading title={t('conduct.title')} subtitle={t('conduct.intro')} />
      <Container maxWidth="md" sx={{ pb: 8 }}>
        <Stack spacing={4}>
          <Stack component="ul" spacing={2} sx={{ listStyle: 'none', p: 0, m: 0 }}>
            {RULES.map((rule) => (
              <Typography
                key={rule}
                component="li"
                variant="body1"
                sx={{ borderInlineStart: 3, borderColor: 'divider', pl: 2 }}
              >
                {t(`conduct.rules.${rule}`)}
              </Typography>
            ))}
          </Stack>

          {/* M-5 — stated plainly, because the line between the two is what
              makes this platform usable by people on opposite sides. */}
          <Stack spacing={1}>
            <Typography variant="h4" component="h2">
              {t('conduct.protected.title')}
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: '68ch' }}>
              {t('conduct.protected.body')}
            </Typography>
          </Stack>

          <Stack spacing={1}>
            <Typography variant="h4" component="h2">
              {t('conduct.symmetry.title')}
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: '68ch' }}>
              {t('conduct.symmetry.body')}
            </Typography>
          </Stack>
        </Stack>
      </Container>
    </>
  );
}
