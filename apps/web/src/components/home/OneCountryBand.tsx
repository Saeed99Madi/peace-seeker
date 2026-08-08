import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@peace/shared';
import { Photo } from '@/components/common/Photo';
import { BRAND } from '@/theme/tokens';

/**
 * "The whole world is one country" — the one statement in the charter that a
 * photograph can say better than type can.
 *
 * It is also the only picture of the planet that takes no side: no borders are
 * visible from there, which is the argument the sentence is making.
 */
export async function OneCountryBand({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'home' });
  const charter = await getTranslations({ locale, namespace: 'charter' });

  return (
    <Box component="section" sx={{ position: 'relative', bgcolor: BRAND.night900, overflow: 'hidden' }}>
      <Photo
        name="earth"
        alt={t('photos.earth.alt')}
        sizes="100vw"
        rounded={false}
        sx={{
          position: 'absolute',
          inset: 0,
          aspectRatio: 'auto',
          height: '100%',
          '& img': { opacity: 0.72 },
        }}
      />
      {/* A wash rather than a flat scrim: the text stays at AA contrast without
          flattening the photograph behind it. */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, ${BRAND.night900}E6 0%, ${BRAND.night900}99 45%, ${BRAND.night900}E6 100%)`,
        }}
      />

      <Container maxWidth="md" sx={{ position: 'relative', py: { xs: 12, md: 18 } }}>
        <Stack spacing={2.5} alignItems="center" sx={{ textAlign: 'center' }}>
          <Typography variant="overline" sx={{ color: BRAND.gold400 }}>
            {t('oneCountry.eyebrow')}
          </Typography>
          <Typography
            variant="h1"
            component="p"
            sx={{ color: BRAND.sand50, maxWidth: '18ch', textWrap: 'balance' }}
          >
            {charter('vision.oneCountry')}
          </Typography>
          <Typography sx={{ color: 'rgba(250,248,243,0.72)', maxWidth: '52ch' }}>
            {charter('principles.oneCountry.body')}
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
