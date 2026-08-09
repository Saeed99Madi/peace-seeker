import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@peace/shared';
import { pageMetadata } from '@/lib/site';
import { PageHeading } from '@/components/common/PageHeading';

export const revalidate = 3600;

const SECTIONS = ['held', 'never', 'limits'] as const;
const CONTROLS = ['hide', 'withdraw', 'delete'] as const;

/**
 * §3.3 / §8 — the platform states in plain words what it knows about a member
 * and what it cannot protect them from. A person deciding whether it is safe to
 * be here needs that before they sign up, not buried in a privacy policy after.
 */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'policy' });
  return pageMetadata(locale as Locale, '/safety', {
    title: t('safety.title'),
    description: t('safety.intro'),
  });
}

export default async function SafetyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'policy' });

  return (
    <>
      <PageHeading maxWidth="md" title={t('safety.title')} subtitle={t('safety.intro')} />
      <Container maxWidth="md" sx={{ pb: 8 }}>
        <Stack spacing={4}>
          <Stack spacing={1}>
            <Typography variant="h4" component="h2">
              {t('safety.controls.title')}
            </Typography>
            <Stack component="ul" spacing={1.5} sx={{ listStyle: 'none', p: 0, m: 0 }}>
              {CONTROLS.map((control) => (
                <Typography
                  key={control}
                  component="li"
                  color="text.secondary"
                  sx={{ borderInlineStart: 3, borderColor: 'primary.main', pl: 2, maxWidth: '68ch' }}
                >
                  {t(`safety.controls.${control}`)}
                </Typography>
              ))}
            </Stack>
          </Stack>

          {SECTIONS.map((section) => (
            <Stack key={section} spacing={1}>
              <Typography variant="h4" component="h2">
                {t(`safety.${section}.title`)}
              </Typography>
              <Typography color="text.secondary" sx={{ maxWidth: '68ch' }}>
                {t(`safety.${section}.body`)}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Container>
    </>
  );
}
