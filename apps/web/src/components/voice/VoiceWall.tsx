import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@peace/shared';
import { fetchVoiceCount, fetchVoices } from '@/lib/voices';
import { LiveWall } from './LiveWall';
import { VoiceCard } from './VoiceCard';

/**
 * A-5 — the Wall of Voices, in a mosaic whose order the server randomises per
 * reader. Randomising here rather than in the client keeps the order stable
 * while a reader pages, and keeps it out of their control.
 */
export async function VoiceWall({ locale, limit = 24 }: { locale: Locale; limit?: number }) {
  const t = await getTranslations({ locale, namespace: 'voice' });
  const [voices, count] = await Promise.all([fetchVoices(limit), fetchVoiceCount()]);

  if (voices.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
        {t('wall.empty')}
      </Typography>
    );
  }

  return (
    <>
      {/* Voices that arrive while this page is open, above the shuffled Wall. */}
      <LiveWall initialCount={count} />
      <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
        },
      }}
    >
      {voices.map((voice) => (
        <VoiceCard key={voice.id} voice={voice} locale={locale} />
      ))}
      </Box>
    </>
  );
}
