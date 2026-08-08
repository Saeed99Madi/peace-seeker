'use client';

import { useState, type MouseEvent } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Check from '@mui/icons-material/Check';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useTranslations } from 'next-intl';
import { LOCALES, LOCALE_LABELS, getDirection, type Locale } from '@peace/shared';
import { usePathname, useRouter } from '@/i18n/navigation';
import { BADGE_STYLE, LOCALE_BADGES } from './locale-badge';
import { SURFACE } from '@/theme/tokens';

/** The square badge beside a language — a letterform, or a flag if configured. */
function Badge({ locale, size = 26 }: { locale: Locale; size?: number }) {
  const badge = LOCALE_BADGES[locale];
  return (
    <Box
      aria-hidden
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        display: 'grid',
        placeItems: 'center',
        borderRadius: `${SURFACE.radiusSmall - 3}px`,
        bgcolor: BADGE_STYLE === 'letter' ? badge.bg : 'transparent',
        color: badge.fg,
        fontSize: BADGE_STYLE === 'letter' ? size * 0.55 : size * 0.72,
        fontWeight: 700,
        lineHeight: 1,
      }}
    >
      <span lang={locale} dir={getDirection(locale)}>
        {BADGE_STYLE === 'letter' ? badge.letter : badge.flag}
      </span>
    </Box>
  );
}

/**
 * I-3 — language is chosen independently of country, and carried in the URL
 * rather than inferred from where the reader appears to be. Each language is
 * written in its own script, so a reader can find their own without first
 * being able to read the current one.
 */
export function LanguageSwitcher({ current }: { current: Locale }) {
  const t = useTranslations('common');
  const router = useRouter();
  const pathname = usePathname();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const choose = (locale: Locale) => {
    setAnchor(null);
    router.replace(pathname, { locale });
  };

  return (
    <>
      <Button
        onClick={(event: MouseEvent<HTMLButtonElement>) => setAnchor(event.currentTarget)}
        color="inherit"
        aria-haspopup="menu"
        aria-label={t('language.change')}
        sx={{ gap: 1, px: 1.5, minWidth: 0 }}
      >
        <Badge locale={current} size={24} />
        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
          {LOCALE_LABELS[current]}
        </Box>
      </Button>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        slotProps={{ paper: { sx: { minWidth: 216, borderRadius: `${SURFACE.radius}px`, mt: 1 } } }}
      >
        {LOCALES.map((locale) => (
          <MenuItem
            key={locale}
            selected={locale === current}
            onClick={() => choose(locale)}
            sx={{ gap: 1.5, py: 1.25 }}
          >
            <Badge locale={locale} />
            <ListItemText
              primary={LOCALE_LABELS[locale]}
              slotProps={{
                primary: { lang: locale, dir: getDirection(locale), fontWeight: 500 },
              }}
            />
            {locale === current ? <Check fontSize="small" color="primary" /> : null}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
