'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useLocale, useTranslations } from 'next-intl';
import { getDirection, isLocale, type Locale, type VoiceCount } from '@peace/shared';
import { useVoiceStream } from '@/hooks/use-voice-stream';
import { countryName } from '@/lib/countries';
import type { PublicVoice } from '@/lib/voices';

/**
 * A-5 — voices arriving on the Wall, live.
 *
 * The animation is deliberately restrained. A voice for peace is not a
 * notification: it does not bounce, flash, chime or fly in from the edge. It
 * fades up and settles, once, the way something is set down on a table — and
 * the whole thing is skipped for a reader who has asked their system for less
 * motion.
 *
 * A caveat worth stating: the Wall is otherwise shuffled per reader so that no
 * voice is privileged (§3.1), and putting arrivals at the top does privilege
 * recency. That is the unavoidable cost of "live". It applies only to voices
 * that arrive while you are watching; the Wall beneath stays shuffled.
 */
function ArrivedCard({ voice, index }: { voice: PublicVoice; index: number }) {
  const t = useTranslations('voice');
  const locale = useLocale() as Locale;
  const place = countryName(voice.country, locale);
  const shown = isLocale(voice.locale) ? voice.locale : locale;

  const attribution =
    voice.attribution.kind === 'anonymousFromCountry'
      ? t('attribution.fromCountry', { country: place ?? '' })
      : (voice.attribution.value ?? t('attribution.anonymous'));

  return (
    <Card
      component="article"
      sx={{
        height: '100%',
        display: 'flex',
        borderColor: 'secondary.main',
        animation: 'peaceArrive .9s cubic-bezier(.16,1,.3,1) both',
        animationDelay: `${Math.min(index, 6) * 70}ms`,
        '@keyframes peaceArrive': {
          from: { opacity: 0, transform: 'translateY(14px) scale(.985)' },
          to: { opacity: 1, transform: 'none' },
        },
        // The border cools from gold back to the ordinary divider, so a new
        // voice is briefly distinguishable and then simply one of the others.
        transition: 'border-color 6s ease 1.2s',
        '@media (prefers-reduced-motion: reduce)': {
          animation: 'none',
          transition: 'none',
        },
      }}
    >
      <CardContent sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        <Stack spacing={1.5} sx={{ flex: 1 }}>
          {voice.message ? (
            <Typography lang={shown} dir={getDirection(shown)} sx={{ whiteSpace: 'pre-wrap' }}>
              {voice.message}
            </Typography>
          ) : null}
        </Stack>
        {/* Pinned to the foot, exactly as on the Wall beneath: an arriving
            voice must not be laid out differently from a settled one. */}
        <Typography variant="caption" color="text.secondary" sx={{ pt: 2 }}>
          {attribution}
          {place && voice.attribution.kind !== 'anonymousFromCountry' ? ` · ${place}` : ''}
        </Typography>
      </CardContent>
    </Card>
  );
}

/** Renders only what has arrived since the page loaded; the rest is server-rendered. */
export function LiveWall({ initialCount }: { initialCount: VoiceCount }) {
  const { arrived } = useVoiceStream(initialCount);
  if (arrived.length === 0) return null;

  return (
    <Box
      aria-live="polite"
      sx={{
        display: 'grid',
        gap: 2,
        mb: 2,
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
      }}
    >
      {arrived.map((voice, index) => (
        <ArrivedCard key={voice.id} voice={voice} index={index} />
      ))}
    </Box>
  );
}
