'use client';

import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { useTranslations } from 'next-intl';
import { apiFetch } from '@/lib/api-client';

type State = 'ready' | 'working' | 'done' | 'invalid';

/**
 * A-9 — withdrawal is a single button, and it asks for nothing: no reason, no
 * confirmation of identity, no attempt to talk the person out of it.
 */
export function WithdrawVoice({ token }: { token: string }) {
  const t = useTranslations('voice.withdraw');
  const [state, setState] = useState<State>(token ? 'ready' : 'invalid');

  const withdraw = async () => {
    setState('working');
    try {
      await apiFetch('/voices/withdraw', { method: 'POST', body: { token } });
      setState('done');
    } catch {
      setState('invalid');
    }
  };

  if (state === 'done') return <Alert severity="success">{t('success')}</Alert>;
  if (state === 'invalid') return <Alert severity="warning">{t('invalid')}</Alert>;

  return (
    <Stack spacing={2} alignItems="flex-start">
      <Button variant="contained" color="error" onClick={withdraw} disabled={state === 'working'}>
        {t('confirm')}
      </Button>
    </Stack>
  );
}
