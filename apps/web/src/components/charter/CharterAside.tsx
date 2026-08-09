import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { Photo } from '@/components/common/Photo';
import type { PhotoName } from '@/lib/photos.generated';

/**
 * A section of the charter with its photograph beside it, as one panel.
 *
 * The first version set the picture in a box with a caption printed under it,
 * which is how a stock photograph looks when it has been dropped into a page.
 * These are built the way a poster is built instead: the image is duotoned onto
 * the same olive-to-cream ramp as everything else (see optimize-photos.mjs), so
 * it stops being a picture of a place and becomes part of the drawing — and the
 * words sit on it, over a scrim dark enough to read against, with the gold rule
 * the rest of the site uses.
 *
 * §3.1 still decides what may be photographed: no face, no flag, no building,
 * no identifiable place. A horizon, a path and a reflection have no side.
 *
 * Sides alternate down the page, and the whole row flips in Arabic with the
 * direction of the text, so the reader meets the picture at the same point in
 * the reading either way.
 */
export function CharterAside({
  photo,
  alt,
  caption,
  flip = false,
  children,
}: {
  photo: PhotoName;
  alt: string;
  caption: string;
  flip?: boolean;
  children: ReactNode;
}) {
  return (
    <Stack
      direction={{ xs: 'column', md: flip ? 'row-reverse' : 'row' }}
      spacing={{ xs: 4, md: 6 }}
      alignItems="flex-start"
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>

      <Box
        component="figure"
        sx={{
          m: 0,
          position: 'relative',
          width: { xs: '100%', md: 320 },
          flexShrink: 0,
          borderRadius: 2,
          overflow: 'hidden',
          alignSelf: { md: 'stretch' },
        }}
      >
        <Photo name={photo} alt={alt} sizes="(max-width: 900px) 100vw, 320px" rounded={false} />

        <Box
          component="figcaption"
          sx={{
            position: 'absolute',
            insetInline: 0,
            bottom: 0,
            p: 2.5,
            pt: 6,
            // Transparent at the top so the picture is never cut in half by a
            // hard edge, opaque enough at the bottom to read AA against.
            background:
              'linear-gradient(to top, rgba(20,25,17,0.92) 0%, rgba(20,25,17,0.78) 42%, rgba(20,25,17,0) 100%)',
          }}
        >
          <Box sx={{ width: 34, height: 2, bgcolor: 'var(--peace-mark-vein)', mb: 1.25 }} />
          <Typography variant="body2" sx={{ color: '#F4F0E7', lineHeight: 1.55 }}>
            {caption}
          </Typography>
        </Box>
      </Box>
    </Stack>
  );
}
