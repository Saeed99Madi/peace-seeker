'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import { useTranslations } from 'next-intl';
import { apiFetch } from '@/lib/api-client';
import { TextLink } from '@/components/common/ButtonLink';

interface Me {
  displayName: string;
  roles: string[];
}

/**
 * Shows the panel only to someone who holds a moderation role.
 *
 * This is a courtesy, not the protection. Every endpoint behind it is guarded
 * by RolesGuard on the server, so hiding the buttons changes what a person is
 * offered, never what they are permitted — a client-side check is a hint to the
 * honest, not a fence against the determined.
 */
export function AdminGate({ children }: { children: ReactNode }) {
  const t = useTranslations('admin');
  const [state, setState] = useState<'checking' | 'allowed' | 'anonymous' | 'forbidden'>('checking');

  useEffect(() => {
    apiFetch<Me>('/members/me')
      .then((me) => {
        const may = me.roles.some((role) => role === 'MODERATOR' || role === 'ADMINISTRATOR');
        setState(may ? 'allowed' : 'forbidden');
      })
      .catch(() => setState('anonymous'));
  }, []);

  if (state === 'checking') return <CircularProgress />;

  if (state === 'anonymous') {
    return (
      <Stack spacing={2} alignItems="flex-start">
        <Alert severity="info">{t('signIn')}</Alert>
        <TextLink href="/auth/signin">{t('signIn')}</TextLink>
      </Stack>
    );
  }

  if (state === 'forbidden') return <Alert severity="warning">{t('notAllowed')}</Alert>;

  return <>{children}</>;
}
