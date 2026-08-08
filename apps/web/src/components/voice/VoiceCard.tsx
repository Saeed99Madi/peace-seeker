import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { getTranslations } from 'next-intl/server';
import { getDirection, isLocale, type Locale } from '@peace/shared';
import { countryName } from '@/lib/countries';
import type { PublicVoice } from '@/lib/voices';

/**
 * One voice on the wall. Every card is the same size and the same weight —
 * there is no featured card, no verified badge and no signal of prominence,
 * because any of those would place one voice above another (§3.1).
 */
export async function VoiceCard({ voice, locale }: { voice: PublicVoice; locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'voice' });
  const place = countryName(voice.country, locale);

  const attribution = (() => {
    switch (voice.attribution.kind) {
      case 'name':
      case 'firstName':
        return voice.attribution.value;
      case 'anonymousFromCountry':
        return t('attribution.fromCountry', { country: place ?? '' });
      default:
        return t('attribution.anonymous');
    }
  })();

  // I-4 — user text is shown in the language it was written in, with its own
  // direction, inside a page that may run the other way.
  const messageLocale = isLocale(voice.locale) ? voice.locale : locale;

  return (
    <Card component="article" sx={{ height: '100%' }}>
      <CardContent>
        <Stack spacing={1.5}>
          {voice.message ? (
            <Typography
              variant="body1"
              lang={messageLocale}
              dir={getDirection(messageLocale)}
              sx={{ whiteSpace: 'pre-wrap' }}
            >
              {voice.message}
            </Typography>
          ) : null}

          {voice.mediaUrl && voice.mediaKind === 'audio' ? (
            <audio controls preload="none" src={voice.mediaUrl} style={{ width: '100%' }} />
          ) : null}
          {voice.mediaUrl && voice.mediaKind === 'video' ? (
            <video controls preload="none" src={voice.mediaUrl} style={{ width: '100%' }} />
          ) : null}

          <Typography variant="caption" color="text.secondary">
            {attribution}
            {place && voice.attribution.kind !== 'anonymousFromCountry' ? ` · ${place}` : ''}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
