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
    // The card fills its grid row, and the attribution is pinned to the foot of
    // it rather than left trailing the text. A row is as tall as its longest
    // voice, so without this the names sit at six different heights and the
    // wall reads as ragged — and a short voice looks like an unfinished one.
    <Card component="article" sx={{ height: '100%', display: 'flex' }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        <Stack spacing={1.5} sx={{ flex: 1 }}>
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

        </Stack>

        {/* A sibling of the Stack, not a child of it: Stack sets the margin on
            its own children, which would override the auto margin that does
            the pinning. */}
        <Typography variant="caption" color="text.secondary" sx={{ pt: 2 }}>
          {attribution}
          {place && voice.attribution.kind !== 'anonymousFromCountry' ? ` · ${place}` : ''}
        </Typography>
      </CardContent>
    </Card>
  );
}
