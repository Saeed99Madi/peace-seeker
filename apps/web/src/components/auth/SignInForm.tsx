'use client';

import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useLocale, useTranslations } from 'next-intl';
import { useSubmit } from '@/hooks/use-submit';

/**
 * S-9 — a magic link, not a password.
 *
 * The response is identical whether or not the address belongs to a member, so
 * this form cannot be used to find out whether a named person is here (§3.3).
 */
export function SignInForm() {
  const t = useTranslations('membership.signIn');
  const locale = useLocale();
  const { run, status } = useSubmit('/auth/magic-link');
  const [email, setEmail] = useState('');

  if (status === 'done') return <Alert severity="success">{t('sent')}</Alert>;

  return (
    <Stack
      component="form"
      spacing={3}
      onSubmit={(event) => {
        event.preventDefault();
        void run({ email, locale });
      }}
      noValidate
    >
      <Typography color="text.secondary">{t('intro')}</Typography>
      <TextField
        type="email"
        label={t('email')}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
        autoComplete="email"
      />
      <Button type="submit" variant="contained" size="large" disabled={status === 'working'}>
        {t('submit')}
      </Button>
    </Stack>
  );
}
