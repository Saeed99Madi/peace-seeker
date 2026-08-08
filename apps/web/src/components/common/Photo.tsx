import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';
import { PHOTOS, type PhotoName } from '@/lib/photos.generated';

interface PhotoProps {
  name: PhotoName;
  /** Describes the picture for a screen reader. Empty string if purely decorative. */
  alt: string;
  /** Widths the image occupies at each breakpoint, for the browser's srcset choice. */
  sizes?: string;
  /** Only for an image above the fold; everything else stays lazy. */
  priority?: boolean;
  rounded?: boolean;
  sx?: SxProps<Theme>;
}

/**
 * A photograph, served as pre-built AVIF and WebP at four widths.
 *
 * This is a plain <picture> rather than next/image on purpose: the pages are
 * statically generated and served from a CDN (§7), and an on-demand image
 * optimiser would put a server back in front of them. Everything it would do —
 * format negotiation, responsive sizes, a blur placeholder, no layout shift —
 * is done at build time instead by scripts/optimize-photos.mjs.
 *
 * The blur placeholder sits underneath as a background image, so on a slow
 * connection there is something in place immediately and the page never jumps.
 */
export function Photo({ name, alt, sizes = '100vw', priority = false, rounded = true, sx }: PhotoProps) {
  const photo = PHOTOS[name];
  const widths = photo.widths as readonly number[];
  const srcSet = (extension: string) =>
    widths.map((width) => `/photos/${name}-${width}.${extension} ${width}w`).join(', ');

  return (
    <Box
      className="photo"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: rounded ? 2 : 0,
        aspectRatio: String(photo.aspect),
        backgroundImage: `url("${photo.blurDataUrl}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        ...sx,
      }}
    >
      <picture>
        <source type="image/avif" srcSet={srcSet('avif')} sizes={sizes} />
        <source type="image/webp" srcSet={srcSet('webp')} sizes={sizes} />
        <Box
          component="img"
          src={`/photos/${name}-${widths[widths.length - 1]}.webp`}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          fetchPriority={priority ? 'high' : 'auto'}
          sx={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </picture>
    </Box>
  );
}
