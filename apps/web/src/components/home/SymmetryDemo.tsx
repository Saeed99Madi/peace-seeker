import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CheckRounded from '@mui/icons-material/CheckRounded';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@peace/shared';
import { Photo } from '@/components/common/Photo';
import { Section } from '@/components/common/Section';

const RIGHTS = ['words', 'window', 'statements', 'visibility', 'withdraw', 'facilitator'] as const;

/**
 * §3.1, shown rather than described.
 *
 * Two panels, rendered from one list by one component, so they cannot drift
 * apart. There is deliberately nothing distinguishing them — no "A" and "B", no
 * label, no identifier. Two identical cards side by side *is* the statement.
 *
 * An earlier version stamped each panel with a random token so a reader could
 * reload and watch them swap. It proved the mechanism and confused everyone who
 * saw it: a hex code on a public page reads as a fault, not as an argument. The
 * guarantee belongs in the sentence underneath, where it can be read.
 */
function PartyPanel({ label, rights }: { label: string; rights: string[] }) {
  return (
    <Card sx={{ flex: 1, minWidth: 0 }}>
      <CardContent sx={{ p: { xs: 3, md: 4 } }}>
        <Stack spacing={2.5}>
          <Typography variant="overline" color="secondary.main">
            {label}
          </Typography>
          <Stack component="ul" spacing={1.75} sx={{ listStyle: 'none', m: 0, p: 0 }}>
            {rights.map((right) => (
              <Stack key={right} component="li" direction="row" spacing={1.5} alignItems="flex-start">
                <CheckRounded fontSize="small" color="primary" sx={{ mt: '0.15em' }} />
                <Typography variant="body2">{right}</Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

export async function SymmetryDemo({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'home' });
  const rights = RIGHTS.map((key) => t(`symmetry.rights.${key}`));
  const label = t('symmetry.party');

  return (
    <Section
      eyebrow={t('symmetry.eyebrow')}
      title={t('symmetry.title')}
      lede={t('symmetry.body')}
      tone="paper"
    >
      <Photo
        name="reach"
        alt={t('photos.reach.alt')}
        sizes="(max-width: 1200px) 100vw, 1100px"
        sx={{ aspectRatio: '21 / 9' }}
      />

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 2, md: 3 }} alignItems="stretch">
        <PartyPanel label={label} rights={rights} />
        <PartyPanel label={label} rights={rights} />
      </Stack>

      <Box sx={{ maxWidth: '62ch' }}>
        <Typography variant="caption" color="text.secondary">
          {t('symmetry.caption')}
        </Typography>
      </Box>
    </Section>
  );
}
