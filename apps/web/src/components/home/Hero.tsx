import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@peace/shared';
import { ButtonLink } from '@/components/common/ButtonLink';
import { PeaceMark } from '@/components/brand/PeaceMark';
import { LiveCount } from '@/components/voice/LiveCount';
import { fetchVoiceCount } from '@/lib/voices';
import { BRAND, RHYTHM } from '@/theme/tokens';

/**
 * A-4 — the counter is the hero, because the number is the argument. One
 * figure, no breakdown, and the line beneath says why there is no breakdown.
 *
 * No photograph anywhere on this page: a picture of a person has a face, a
 * dress and a landscape, all of which get read as one side or another (§3.1) —
 * and one would cost more than the whole 300 KB landing budget (§7). The colour
 * has to do the work instead.
 */
export async function Hero({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'home' });
  const v = await getTranslations({ locale, namespace: 'voice' });
  const charter = await getTranslations({ locale, namespace: 'charter' });
  const count = await fetchVoiceCount();

  return (
    <Box
      component="section"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        // Two pools of light, olive and gold, set equidistant from the centre:
        // the mark's own geometry at the scale of the page.
        backgroundImage: `radial-gradient(58% 62% at 16% 4%, ${BRAND.olive100} 0%, transparent 64%),
                          radial-gradient(52% 58% at 86% 14%, ${BRAND.gold200} 0%, transparent 66%),
                          linear-gradient(180deg, ${BRAND.sand100} 0%, ${BRAND.sand50} 78%)`,
      }}
    >
      <Container maxWidth="md" sx={{ position: 'relative', py: { xs: 8, md: 13 } }}>
        <Stack spacing={4} alignItems="center" sx={{ textAlign: 'center' }}>
          <PeaceMark size={112} title={t('mark.alt')} />

          <Typography variant="overline" color="secondary.main">
            {t('eyebrow')}
          </Typography>

          {/* Server-rendered from the cached figure, then corrected and kept
              live over a WebSocket once the page is interactive. */}
          <LiveCount initial={count} />

          <Divider sx={{ width: 56, borderBottomWidth: 2, borderColor: 'secondary.main' }} />

          <Typography
            variant="h3"
            component="p"
            sx={{ maxWidth: '30ch', fontWeight: 500, textWrap: 'balance' }}
          >
            {charter('peace.definition')}
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ width: { xs: '100%', sm: 'auto' }, pt: 1 }}
          >
            <ButtonLink href="/voices/new" variant="contained" size="large">
              {v('hero.cta')}
            </ButtonLink>
            <ButtonLink href="/charter" variant="outlined" size="large" color="inherit">
              {t('vision.cta')}
            </ButtonLink>
          </Stack>

          <Typography variant="caption" color="text.secondary" sx={{ maxWidth: RHYTHM.proseWidth }}>
            {v('counter.note')}
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
