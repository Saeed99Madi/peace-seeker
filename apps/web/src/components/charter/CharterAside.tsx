import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { Photo } from '@/components/common/Photo';
import type { PhotoName } from '@/lib/photos.generated';

/**
 * A section of the charter with its photograph beside it.
 *
 * The picture is not decoration and it does not repeat the text: each one
 * carries the section's actual argument in a form the text cannot take. So it
 * gets a caption naming what it is doing there, and it is a real part of the
 * reading rather than a band of colour behind it.
 *
 * §3.1 constrains photography here more than anywhere else — none of these
 * shows a face, a flag, a building or a place, because any of those can be read
 * as belonging to one side. Hands and a tree can not.
 *
 * Sides alternate down the page. In Arabic the whole row flips with the
 * direction of the text, which is the correct behaviour and needs no code: a
 * reader going right-to-left meets the photograph in the same place in the
 * reading order that a reader going left-to-right does.
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
      spacing={{ xs: 3, md: 6 }}
      alignItems="flex-start"
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>

      <Stack
        component="figure"
        spacing={1.5}
        sx={{
          m: 0,
          width: { xs: '100%', md: 320 },
          flexShrink: 0,
          // Held in view while a long section scrolls past it, so the picture
          // stays with the argument it belongs to instead of leaving at the
          // first paragraph.
          position: { md: 'sticky' },
          top: { md: 96 },
        }}
      >
        <Photo name={photo} alt={alt} sizes="(max-width: 900px) 100vw, 320px" />
        <Typography
          component="figcaption"
          variant="caption"
          color="text.secondary"
          sx={{
            borderInlineStart: '2px solid',
            borderColor: 'secondary.main',
            pl: 1.5,
            lineHeight: 1.6,
          }}
        >
          {caption}
        </Typography>
      </Stack>
    </Stack>
  );
}
