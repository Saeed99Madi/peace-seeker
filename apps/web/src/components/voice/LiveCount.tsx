'use client';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useLocale, useTranslations } from 'next-intl';
import type { VoiceCount } from '@peace/shared';
import { useVoiceStream } from '@/hooks/use-voice-stream';

/**
 * A-4 — the number, kept live.
 *
 * It changes without announcing itself: no flash, no confetti, no "+1" flying
 * across the screen. §3.2 rules out anything that treats a person choosing
 * peace as an engagement event. The only motion is a brief, quiet transition on
 * the digits, and even that is dropped for a reader who has asked their system
 * for less motion.
 */
export function LiveCount({ initial }: { initial: VoiceCount }) {
  const t = useTranslations('voice');
  const locale = useLocale();
  const { count } = useVoiceStream(initial);
  const formatter = new Intl.NumberFormat(locale);

  return (
    <Stack spacing={1.5} alignItems="center" role="status" aria-live="polite" aria-atomic="true">
      <Typography
        className="tabular"
        component="p"
        sx={{
          fontSize: 'clamp(4rem, 2rem + 9vw, 7.5rem)',
          fontWeight: 700,
          lineHeight: 0.95,
          letterSpacing: '-0.03em',
          // 'main', not 'dark': the dark shade of the palette is a *darker
          // green*, which on a dark background is the number nearly invisible.
          // 'main' is the shade that flips with the scheme.
          color: 'primary.main',
          transition: 'opacity .35s ease',
          '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
        }}
      >
        {formatter.format(count.total)}
      </Typography>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 500 }}>
        {t('counter.label', { count: count.total })}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {t('counter.countries', { count: count.countriesRepresented })}
      </Typography>
    </Stack>
  );
}
