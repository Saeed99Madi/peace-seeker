import Link from '@mui/material/Link';
import { getTranslations } from 'next-intl/server';

/**
 * §7, Accessibility — full keyboard navigation. The link is off-screen until it
 * takes focus, so the first Tab on any page offers a way past the header.
 *
 * A server component: it has no state and no handlers, so rendering it on the
 * client would put it in the bundle for nothing.
 */
export async function SkipLink() {
  const t = await getTranslations('common');

  return (
    <Link
      href="#main"
      sx={{
        position: 'absolute',
        insetInlineStart: 8,
        top: -64,
        zIndex: 1400,
        px: 2,
        py: 1.5,
        borderRadius: 1,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        '&:focus': { top: 8 },
      }}
    >
      {t('nav.skipToContent')}
    </Link>
  );
}
