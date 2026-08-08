import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { getTranslations } from 'next-intl/server';
import { TextLink } from '@/components/common/ButtonLink';

/**
 * A footer link is a navigation target, not prose, so the WCAG inline-text
 * exemption does not cover it. The text stays its own size; the *touch* area is
 * padded out to 44px, which is what a thumb actually needs (§7).
 */
const LINK_TAP_AREA = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 44,
} as const;

/**
 * §15 — the non-goals are stated on every page, not buried in a policy. A
 * person in trouble should not have to go looking to learn that this is not a
 * court and not an emergency service.
 */
export async function AppFooter() {
  const t = await getTranslations('common');

  return (
    <Box component="footer" sx={{ mt: 8, borderTop: 1, borderColor: 'divider' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: '70ch' }}>
            {t('footer.notLegal')}
          </Typography>
          <Divider />
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={{ xs: 1, sm: 3 }}
            useFlexGap
            flexWrap="wrap"
          >
            <TextLink sx={LINK_TAP_AREA} href="/charter" variant="body2">
              {t('nav.charter')}
            </TextLink>
            <TextLink sx={LINK_TAP_AREA} href="/conduct" variant="body2">
              {t('nav.conduct')}
            </TextLink>
            <TextLink sx={LINK_TAP_AREA} href="/safety" variant="body2">
              {t('nav.safety')}
            </TextLink>
            <TextLink sx={LINK_TAP_AREA} href="/transparency" variant="body2">
              {t('footer.transparency')}
            </TextLink>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {t('footer.noTracking')} · {t('brand.foundation')}
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
