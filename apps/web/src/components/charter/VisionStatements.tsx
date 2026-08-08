import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { getTranslations } from 'next-intl/server';
import { VISION_KEYS, type Locale } from '@peace/shared';

/**
 * §2 — the seven statements of the vision.
 *
 * They are rendered as a list of equals with no numbering and no emphasis on
 * any one of them, in the order the charter sets down.
 */
export async function VisionStatements({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'charter' });

  return (
    <Stack spacing={3}>
      <Typography variant="h2" component="h2">
        {t('vision.heading')}
      </Typography>
      <Stack component="ul" spacing={2} sx={{ listStyle: 'none', p: 0, m: 0 }}>
        {VISION_KEYS.map((key) => (
          <Typography
            key={key}
            component="li"
            variant="h5"
            sx={{
              fontWeight: 400,
              borderInlineStart: 3,
              borderColor: 'primary.main',
              pl: 2,
              py: 0.5,
            }}
          >
            {t(`vision.${key}`)}
          </Typography>
        ))}
      </Stack>
    </Stack>
  );
}
