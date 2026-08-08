import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

interface PageHeadingProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

/** One heading treatment for every page, so no section reads as more important. */
export function PageHeading({ title, subtitle, children }: PageHeadingProps) {
  return (
    <Container maxWidth="lg" sx={{ pt: { xs: 4, md: 6 }, pb: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h1" component="h1">
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '65ch' }}>
            {subtitle}
          </Typography>
        ) : null}
        {children}
      </Stack>
    </Container>
  );
}
