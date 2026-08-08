'use client';

import { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import dynamic from 'next/dynamic';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import MenuIcon from '@mui/icons-material/Menu';
import { useTranslations } from 'next-intl';
import type { Locale } from '@peace/shared';
import { Link } from '@/i18n/navigation';
import { PeaceMark } from '@/components/brand/PeaceMark';
import { RHYTHM } from '@/theme/tokens';
import { LanguageSwitcher } from './LanguageSwitcher';

/**
 * §7 — the mobile drawer pulls in Modal, Portal and Backdrop, which is a lot of
 * JavaScript for a panel most readers never open. Loading it on first tap keeps
 * it out of the initial bundle and the landing page inside its 300 KB budget.
 */
const Drawer = dynamic(() => import('@mui/material/Drawer'), { ssr: false });

const ROUTES = [
  { href: '/charter', key: 'charter' },
  { href: '/voices', key: 'voices' },
  { href: '/circles', key: 'circles' },
  { href: '/path', key: 'path' },
] as const;

const DRAWER_ROUTES = [
  ...ROUTES,
  { href: '/members', key: 'members' },
  { href: '/join', key: 'join' },
  { href: '/conduct', key: 'conduct' },
  { href: '/safety', key: 'safety' },
] as const;

export function AppHeader({ locale }: { locale: Locale }) {
  const t = useTranslations('common');
  const [open, setOpen] = useState(false);

  return (
    <AppBar position="sticky" component="header">
      <Toolbar sx={{ gap: 1, maxWidth: RHYTHM.contentWidth, mx: 'auto', width: '100%', py: 1 }}>
        <Box
          component={Link}
          href="/"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            flexGrow: 1,
            color: 'inherit',
            textDecoration: 'none',
            minWidth: 0,
            minHeight: 44,
          }}
        >
          <PeaceMark size={34} />
          <Typography
            variant="h6"
            component="span"
            sx={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {t('brand.name')}
          </Typography>
        </Box>

        <Box component="nav" sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.25 }}>
          {ROUTES.map((route) => (
            <Button key={route.href} component={Link} href={route.href} color="inherit">
              {t(`nav.${route.key}`)}
            </Button>
          ))}
        </Box>

        <LanguageSwitcher current={locale} />

        <Button
          component={Link}
          href="/voices/new"
          variant="contained"
          color="primary"
          sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
        >
          {t('nav.addVoice')}
        </Button>

        <IconButton
          onClick={() => setOpen(true)}
          sx={{ display: { md: 'none' }, width: 44, height: 44 }}
          aria-label={t('nav.menu')}
          color="inherit"
        >
          <MenuIcon />
        </IconButton>
      </Toolbar>

      {/* I-2 — the drawer opens from the edge the reader starts at: the left in
          English, the right in Arabic.
          `anchor="left"` is correct for both, and deliberately not conditional.
          The stylis RTL plugin already flips the drawer's own left/right rules,
          so passing anchor="right" for Arabic flipped it a second time and put
          it back on the left. Verified in the browser at 360px, both scripts. */}
      {open ? (
      <Drawer anchor="left" open={open} onClose={() => setOpen(false)}>
        <Box sx={{ width: 272 }} role="presentation" onClick={() => setOpen(false)}>
          <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <PeaceMark size={30} />
            <Typography variant="h6">{t('brand.name')}</Typography>
          </Box>
          <List>
            {DRAWER_ROUTES.map((route) => (
              <ListItemButton key={route.href} component={Link} href={route.href}>
                <ListItemText primary={t(`nav.${route.key}`)} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>
      ) : null}
    </AppBar>
  );
}
