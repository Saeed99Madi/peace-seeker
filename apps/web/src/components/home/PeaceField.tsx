'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { VoiceCount } from '@peace/shared';
import { useVoiceStream } from '@/hooks/use-voice-stream';

/**
 * "People need peace: N" — the number as a field of people rather than a digit.
 *
 * One mark for one person. A digit is a quantity and the eye slides off it; a
 * field of marks is a crowd, and you can see it grow. When a voice arrives over
 * the socket a new mark lights — gold for a moment, then it settles into the
 * field with all the others and is no longer distinguishable from them. That is
 * the whole point, and it is §3.1 in an animation: the newest voice ends up
 * exactly equal to the oldest.
 *
 * It is a visualisation, not a scoreboard. Nothing here ranks, streaks or
 * rewards, which §3.2 forbids — the field only shows how many people have said
 * the same thing.
 */

/** Beyond this the marks stop being countable and start being wallpaper. */
const MAX_MARKS = 240;

export function PeaceField({ initial }: { initial: VoiceCount }) {
  const t = useTranslations('home.field');
  const locale = useLocale();
  const { count } = useVoiceStream(initial);
  const total = count.total;

  const shown = Math.min(total, MAX_MARKS);
  const previous = useRef(shown);
  const [litFrom, setLitFrom] = useState(shown);

  useEffect(() => {
    if (shown > previous.current) setLitFrom(previous.current);
    previous.current = shown;
  }, [shown]);

  const formatted = new Intl.NumberFormat(locale).format(total);

  return (
    <Box
      component="section"
      sx={{
        py: { xs: 7, md: 10 },
        px: 2,
        backgroundImage: 'var(--peace-field-bg)',
        borderBlock: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack spacing={{ xs: 4, md: 5 }} alignItems="center">
        <Typography
          variant="h3"
          component="p"
          sx={{ maxWidth: '22ch', textAlign: 'center', fontWeight: 500, textWrap: 'balance' }}
        >
          {total === 0
            ? t('empty')
            : t.rich('said', {
                count: formatted,
                n: (chunks) => (
                  <Box
                    component="span"
                    className="tabular"
                    sx={{ color: 'primary.main', fontWeight: 700, whiteSpace: 'nowrap' }}
                  >
                    {chunks}
                  </Box>
                ),
              })}
        </Typography>

        {shown > 0 && (
          <Box
            aria-hidden
            sx={{
              display: 'grid',
              gap: { xs: 0.9, md: 1.2 },
              gridTemplateColumns: 'repeat(auto-fit, minmax(9px, 1fr))',
              width: '100%',
              maxWidth: 620,
              // Marks land in reading order, and reading order is the reader's:
              // in Arabic the field fills from the right, like the text above it.
              direction: 'inherit',
              '@keyframes peaceLight': {
                from: { transform: 'scale(0)', opacity: 0 },
                '60%': { transform: 'scale(1.35)' },
                to: { transform: 'scale(1)', opacity: 1 },
              },
              '@keyframes peaceCool': {
                from: { backgroundColor: 'var(--mui-palette-secondary-main)' },
                to: { backgroundColor: 'var(--mui-palette-primary-main)' },
              },
            }}
          >
            {Array.from({ length: shown }, (_, i) => {
              const isNew = i >= litFrom;
              return (
                <Box
                  key={i}
                  sx={{
                    aspectRatio: '1',
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                    // A field of identical dots reads as a printed pattern; a
                    // little variation reads as people.
                    opacity: 0.55 + ((i * 37) % 9) / 20,
                    ...(isNew && {
                      animation: `peaceLight .5s cubic-bezier(.16,1,.3,1) ${Math.min((i - litFrom) * 45, 900)}ms both,
                                  peaceCool 5s ease-out ${Math.min((i - litFrom) * 45, 900)}ms both`,
                    }),
                    '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
                  }}
                />
              );
            })}
          </Box>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
          {total > MAX_MARKS
            ? t('capped', { shown: new Intl.NumberFormat(locale).format(MAX_MARKS), count: formatted })
            : t('caption')}
        </Typography>
      </Stack>
    </Box>
  );
}
