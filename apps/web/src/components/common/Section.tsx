import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { BRAND, RHYTHM } from './../../theme/tokens';

/**
 * Bands of the page, in one of three grounds. Alternating them is what gives a
 * long page a pulse instead of a scroll — but the sequence is fixed here rather
 * than chosen per page, so the rhythm is the same everywhere.
 */
export type SectionTone = 'sand' | 'paper' | 'deep';

interface SectionProps {
  eyebrow?: string;
  title?: string;
  lede?: string;
  children: ReactNode;
  tone?: SectionTone;
  tight?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg';
}

const GROUNDS: Record<SectionTone, object> = {
  sand: {},
  paper: { bgcolor: 'background.paper', borderBlock: 1, borderColor: 'divider' },
  deep: {
    color: BRAND.sand50,
    backgroundColor: BRAND.olive900,
    backgroundImage: `radial-gradient(80% 120% at 12% 0%, ${BRAND.olive800} 0%, transparent 60%),
                      radial-gradient(60% 100% at 92% 100%, ${BRAND.gold700}44 0%, transparent 62%)`,
  },
};

export function Section({
  eyebrow,
  title,
  lede,
  children,
  tone = 'sand',
  tight = false,
  maxWidth = 'lg',
}: SectionProps) {
  const onDeep = tone === 'deep';

  return (
    <Box
      component="section"
      sx={{ py: tight ? RHYTHM.sectionYTight : RHYTHM.sectionY, ...GROUNDS[tone] }}
    >
      <Container maxWidth={maxWidth}>
        <Stack spacing={RHYTHM.stack}>
          {eyebrow || title || lede ? (
            <Stack spacing={1.5} sx={{ maxWidth: RHYTHM.proseWidth }}>
              {eyebrow ? (
                <Typography variant="overline" sx={{ color: onDeep ? BRAND.gold400 : 'secondary.main' }}>
                  {eyebrow}
                </Typography>
              ) : null}
              {title ? (
                <Typography variant="h2" component="h2">
                  {title}
                </Typography>
              ) : null}
              {lede ? (
                <Typography
                  variant="body1"
                  sx={{ color: onDeep ? 'rgba(250,248,243,0.78)' : 'text.secondary' }}
                >
                  {lede}
                </Typography>
              ) : null}
            </Stack>
          ) : null}
          {children}
        </Stack>
      </Container>
    </Box>
  );
}
