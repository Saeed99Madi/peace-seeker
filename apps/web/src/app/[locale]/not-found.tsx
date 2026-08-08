import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { getTranslations } from 'next-intl/server';
import { ButtonLink } from '@/components/common/ButtonLink';
import { PeaceMark } from '@/components/brand/PeaceMark';
import { RHYTHM } from '@/theme/tokens';

/**
 * A mistyped address should not read like a failure the reader caused, and it
 * should certainly not suggest their account or their voice is gone — which is
 * the first thing someone taking a risk to be here will wonder. So the page
 * says so plainly, in their own language, and offers two ways onward.
 */
export default async function NotFound() {
  const t = await getTranslations('common');

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 8, md: 14 } }}>
      <Stack spacing={3} alignItems="flex-start">
        <PeaceMark size={56} />
        <Typography variant="h1" component="h1">
          {t('notFound.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: RHYTHM.proseWidth }}>
          {t('notFound.body')}
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ pt: 1 }}>
          <ButtonLink href="/" variant="contained" size="large">
            {t('notFound.home')}
          </ButtonLink>
          <ButtonLink href="/voices" variant="outlined" color="inherit" size="large">
            {t('notFound.voices')}
          </ButtonLink>
        </Stack>
      </Stack>
    </Container>
  );
}
