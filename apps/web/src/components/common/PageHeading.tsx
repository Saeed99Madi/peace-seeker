import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

interface PageHeadingProps {
  title: string;
  subtitle?: string;
  /**
   * Must match the width of the Container holding the page's body.
   *
   * The heading and the text under it are in two different Containers, so if
   * these disagree the title hangs to one side of its own page — on the charter
   * it sat about 110px left of every paragraph it introduced. scripts/
   * check-layout.mjs fails the lint when a page sets one and not the other.
   */
  maxWidth?: 'sm' | 'md' | 'lg';
  children?: ReactNode;
}

/** One heading treatment for every page, so no section reads as more important. */
export function PageHeading({ title, subtitle, maxWidth = 'lg', children }: PageHeadingProps) {
  return (
    <Container maxWidth={maxWidth} sx={{ pt: { xs: 4, md: 6 }, pb: 3 }}>
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
