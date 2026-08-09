import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { getTranslations } from 'next-intl/server';
import { VISION_KEYS, type Locale } from '@peace/shared';
import { Photo } from '@/components/common/Photo';
import type { PhotoName } from '@/lib/photos.generated';

/**
 * §2 — the seven statements of the vision, each with its own photograph.
 *
 * The first attempt drew each statement as a small line icon in a tinted disc,
 * and it looked like a settings menu. These say enormous things — the universe,
 * the nerve cell, the whole world as one country — and a 24px pictogram cannot
 * carry any of them.
 *
 * So each one gets a real photograph of the thing it is actually about: the
 * Pillars of Creation, Purkinje neurons, scaffolding, a nautilus, a murmuration
 * of thousands of equals, Earthrise, a dandelion clock. All are public domain
 * or CC-licensed science and nature photography — no face, no flag, no
 * identifiable place, per §3.1 — and all are duotoned onto the same
 * olive-to-cream ramp, so seven separate photographs read as one set instead of
 * seven downloads.
 *
 * They stay equals: the same tile, the same size, the same type, no numbering.
 * The side alternates only so the eye has a rhythm to follow down the seven,
 * and it flips wholesale in Arabic with the direction of the text.
 */
export async function VisionStatements({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'charter' });

  return (
    <Stack spacing={3}>
      <Typography variant="h2" component="h2">
        {t('vision.heading')}
      </Typography>

      {/* Held to a measure. At the full width of the page the picture and the
          sentence it belongs to sat at opposite ends of a canyon, and the
          alternation read as a mistake rather than a rhythm. */}
      <Stack component="ul" spacing={0} sx={{ listStyle: 'none', p: 0, m: 0, maxWidth: 800 }}>
        {VISION_KEYS.map((key, index) => (
          <Stack
            key={key}
            component="li"
            direction={{ xs: 'column', sm: index % 2 ? 'row-reverse' : 'row' }}
            spacing={{ xs: 2.5, sm: 5 }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            sx={{
              py: { xs: 3.5, md: 5 },
              borderBottom: index === VISION_KEYS.length - 1 ? 0 : '1px solid',
              borderColor: 'divider',
            }}
          >
            <Photo
              name={`vision-${key}` as PhotoName}
              alt={t(`vision.alt.${key}`)}
              sizes="(max-width: 600px) 100vw, 208px"
              sx={{ width: { xs: '100%', sm: 208 }, flexShrink: 0 }}
            />
            <Typography
              variant="h4"
              component="p"
              sx={{ fontWeight: 500, textWrap: 'pretty', flex: 1 }}
            >
              {t(`vision.${key}`)}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}
