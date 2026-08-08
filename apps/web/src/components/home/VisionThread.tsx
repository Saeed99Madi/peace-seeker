import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { getTranslations } from 'next-intl/server';
import { VISION_KEYS, type Locale } from '@peace/shared';
import { ButtonLink } from '@/components/common/ButtonLink';
import { Photo } from '@/components/common/Photo';
import { Section } from '@/components/common/Section';
import { BRAND } from '@/theme/tokens';

/** The node on the stem: the mark's leaf, reduced to its smallest useful form. */
function LeafNode() {
  return (
    <Box
      aria-hidden
      component="svg"
      viewBox="0 0 24 24"
      sx={{ width: 26, height: 26, flexShrink: 0, mt: '0.28em' }}
    >
      <circle cx="12" cy="12" r="11.5" fill="var(--mui-palette-background-default)" />
      <path d="M12 2.5 A 10.5 10.5 0 0 1 12 21.5 A 10.5 10.5 0 0 1 12 2.5 Z" fill={BRAND.olive700} />
      <path
        d="M12 5.5 L12 18.5 M12 10 Q 10 9.4 8.6 7.8 M12 10 Q 14 9.4 15.4 7.8
           M12 14 Q 10 13.4 8.6 11.8 M12 14 Q 14 13.4 15.4 11.8"
        stroke={BRAND.gold400}
        strokeWidth="1.15"
        strokeLinecap="round"
        fill="none"
      />
    </Box>
  );
}

/**
 * §2 — the seven statements of the vision, threaded on a single stem.
 *
 * They are set as equals: same size, same weight, same indent, no numbering.
 * The order is the charter's, and the stem is drawn with logical properties so
 * it runs down the reader's starting edge in every script (I-2).
 */
export async function VisionThread({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'charter' });
  const home = await getTranslations({ locale, namespace: 'home' });

  return (
    <Section eyebrow={home('vision.eyebrow')} title={home('vision.title')}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 4, md: 8 }} alignItems="flex-start">
      <Stack
        component="ul"
        spacing={0}
        sx={{
          listStyle: 'none',
          m: 0,
          p: 0,
          flex: 1,
          borderInlineStart: '2px solid',
          borderColor: 'divider',
          maxWidth: '58ch',
        }}
      >
        {VISION_KEYS.map((key) => (
          <Stack
            key={key}
            component="li"
            direction="row"
            spacing={2}
            sx={{ py: 2.25, pl: 3, marginInlineStart: '-11px', alignItems: 'flex-start' }}
          >
            <LeafNode />
            <Typography variant="h4" component="p" sx={{ fontWeight: 500 }}>
              {t(`vision.${key}`)}
            </Typography>
          </Stack>
        ))}
      </Stack>

        <Photo
          name="olive"
          alt={home('photos.olive.alt')}
          sizes="(max-width: 900px) 100vw, 420px"
          sx={{ width: { xs: '100%', md: 420 }, flexShrink: 0, position: 'sticky', top: 96 }}
        />
      </Stack>

      <Box>
        <ButtonLink href="/charter" variant="outlined" color="inherit">
          {home('vision.cta')}
        </ButtonLink>
      </Box>
    </Section>
  );
}
