import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@peace/shared';
import { fetchVoiceCount } from '@/lib/voices';

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
  const formatter = new Intl.NumberFormat(locale);

  return (
    <Stack spacing={1} alignItems="center" role="status">
      <Typography
        component="p"
        sx={{ fontSize: 'clamp(2.5rem, 9vw, 5rem)', fontWeight: 700, lineHeight: 1.1 }}
      >
        {formatter.format(count.total)}
      </Typography>
      <Typography variant="h5" component="p" sx={{ textAlign: 'center' }}>
        {t('counter.label', { count: count.total })}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {t('counter.countries', { count: count.countriesRepresented })}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ maxWidth: '40ch', textAlign: 'center' }}>
        {t('counter.note')}
      </Typography>
    </Stack>
  );
}
