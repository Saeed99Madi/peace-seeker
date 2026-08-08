import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@peace/shared';
import { ButtonLink } from '@/components/common/ButtonLink';
import { Section } from '@/components/common/Section';
import { Hero } from '@/components/home/Hero';
import { OneCountryBand } from '@/components/home/OneCountryBand';
import { Photo } from '@/components/common/Photo';
import { SymmetryDemo } from '@/components/home/SymmetryDemo';
import { VisionThread } from '@/components/home/VisionThread';
import { VoiceWall } from '@/components/voice/VoiceWall';
import { pageMetadata } from '@/lib/site';
import { RHYTHM } from '@/theme/tokens';

/** Statically generated and CDN-cacheable, per §7 (Performance, Availability). */
export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const voice = await getTranslations({ locale, namespace: 'voice' });
  return pageMetadata(locale as Locale, '', { description: voice('hero.body') });
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'home' });
  const voice = await getTranslations({ locale, namespace: 'voice' });

  return (
    <>
      <Hero locale={locale as Locale} />

      <VisionThread locale={locale as Locale} />

      <OneCountryBand locale={locale as Locale} />

      <SymmetryDemo locale={locale as Locale} />

      <Section eyebrow={t('wall.eyebrow')} title={voice('wall.title')} lede={voice('wall.subtitle')}>
        <VoiceWall locale={locale as Locale} limit={9} />
        <Box>
          <ButtonLink href="/voices" variant="outlined" color="inherit">
            {t('wall.cta')}
          </ButtonLink>
        </Box>
      </Section>

      {/* The page closes on the darkest ground it has, because this is the ask. */}
      <Section eyebrow={t('join.eyebrow')} tone="deep">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 4, md: 8 }} alignItems="center">
          <Stack spacing={3} sx={{ flex: 1, maxWidth: RHYTHM.proseWidth }}>
            <Typography variant="h2" component="h2">
              {t('join.title')}
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(250,248,243,0.8)' }}>
              {t('join.body')}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ pt: 1 }}>
              <ButtonLink href="/join" variant="contained" color="secondary" size="large">
                {t('join.cta')}
              </ButtonLink>
              <ButtonLink href="/safety" variant="outlined" color="inherit" size="large">
                {t('join.secondary')}
              </ButtonLink>
            </Stack>
          </Stack>
          <Photo
            name="offer"
            alt={t('photos.offer.alt')}
            sizes="(max-width: 900px) 100vw, 460px"
            sx={{ width: { xs: '100%', md: 460 }, flexShrink: 0 }}
          />
        </Stack>
      </Section>
    </>
  );
}
