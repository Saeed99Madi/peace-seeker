import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@peace/shared';
import { pageMetadata } from '@/lib/site';
import { PageHeading } from '@/components/common/PageHeading';
import { apiFetch } from '@/lib/api-client';

export const revalidate = 120;

interface Circle {
  id: string;
  name: string;
  type: 'GEOGRAPHIC' | 'THEMATIC';
  description: string;
  generalArea: string | null;
}

async function fetchCircles(): Promise<Circle[]> {
  try {
    return (await apiFetch<{ items: Circle[] }>('/circles', { revalidate: 120 })).items;
  } catch {
    return [];
  }
}

/** C-1 — circles listed in the order they were created; no "most active". */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'community' });
  return pageMetadata(locale as Locale, '/circles', {
    title: t('circles.title'),
    description: t('circles.intro'),
  });
}

export default async function CirclesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'community' });
  const circles = await fetchCircles();

  return (
    <>
      <PageHeading title={t('circles.title')} subtitle={t('circles.intro')} />
      <Container maxWidth="lg" sx={{ pb: 8 }}>
        {circles.length === 0 ? (
          <Typography color="text.secondary">{t('circles.empty')}</Typography>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            }}
          >
            {circles.map((circle) => (
              <Card key={circle.id} component="article">
                <CardContent>
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="h6" component="h2">
                        {circle.name}
                      </Typography>
                      <Chip size="small" label={t(`circles.types.${circle.type}`)} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {circle.description}
                    </Typography>
                    {circle.generalArea ? (
                      <Typography variant="caption" color="text.secondary">
                        {circle.generalArea}
                      </Typography>
                    ) : null}
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Container>
    </>
  );
}
