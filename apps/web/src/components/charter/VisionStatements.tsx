import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { getTranslations } from 'next-intl/server';
import { VISION_KEYS, type Locale } from '@peace/shared';
import { VISION_GLYPHS } from './vision-glyphs';

/**
 * §2 — the seven statements of the vision, each with its own drawing.
 *
 * They stay a list of equals: the same panel, the same type, the same size of
 * drawing, no numbering and no order of importance beyond the charter's own.
 * The drawing is what changes, because each statement is about a different
 * thing and deserves to be seen as well as read.
 *
 * The drawing sits at the reader's starting edge on every row. Alternating the
 * side was the first attempt and it looked like a mistake: with the text set to
 * its natural measure, every second row packed to the far edge and left half
 * the width empty. One column of equals is also the truer reading of §2.
 */
function Glyph({ statement }: { statement: string }) {
  return (
    <Box
      aria-hidden
      sx={{
        width: { xs: 96, md: 132 },
        height: { xs: 96, md: 132 },
        flexShrink: 0,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        // Declared for both colour schemes in theme/palette.ts.
        backgroundImage: 'var(--peace-glyph-bg)',
      }}
    >
      <Box component="svg" viewBox="0 0 64 64" sx={{ width: '68%', height: '68%' }}>
        {VISION_GLYPHS[statement]}
      </Box>
    </Box>
  );
}

export async function VisionStatements({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'charter' });

  return (
    <Stack spacing={3}>
      <Typography variant="h2" component="h2">
        {t('vision.heading')}
      </Typography>

      <Stack component="ul" spacing={0} sx={{ listStyle: 'none', p: 0, m: 0 }}>
        {VISION_KEYS.map((key, index) => (
          <Stack
            key={key}
            component="li"
            direction={{ xs: 'column', sm: 'row' }}
            spacing={{ xs: 2.5, sm: 4 }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            sx={{
              py: { xs: 3.5, md: 4.5 },
              borderBottom: index === VISION_KEYS.length - 1 ? 0 : '1px solid',
              borderColor: 'divider',
            }}
          >
            <Glyph statement={key} />
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
