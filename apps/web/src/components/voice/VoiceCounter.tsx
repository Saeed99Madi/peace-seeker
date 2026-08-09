import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@peace/shared';
import { fetchVoiceCount } from '@/lib/voices';
import { LiveCount } from './LiveCount';

/**
 * A-4 — the single global counter, displayed prominently.
 *
 * There is one number here and there will only ever be one. The note beneath it
 * says so out loud, because a visitor arriving from a conflict will look for
 * the breakdown, and the absence of one is the point being made (§3.1).
 */
export async function VoiceCounter({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'voice' });
  const count = await fetchVoiceCount();

  return (
    <Stack spacing={1} alignItems="center">
      <LiveCount initial={count} />
      <Typography variant="caption" color="text.secondary" sx={{ maxWidth: '40ch', textAlign: 'center' }}>
        {t('counter.note')}
      </Typography>
    </Stack>
  );
}
