'use client';

import { useEffect, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslations } from 'next-intl';
import { apiFetch } from '@/lib/api-client';
import { useRouter } from '@/i18n/navigation';

export function VerifyMagicLink({ token }: { token: string }) {
  const t = useTranslations('membership.signIn');
  const router = useRouter();
  const [failed, setFailed] = useState(!token);
  // The token is single-use; React's development double-mount would burn it.
  const attempted = useRef(false);

  useEffect(() => {
    if (!token || attempted.current) return;
    attempted.current = true;

    apiFetch('/auth/verify', { method: 'POST', body: { token } })
      .then(() => router.replace('/'))
      .catch(() => setFailed(true));
  }, [router, token]);

  if (failed) return <Alert severity="warning">{t('failed')}</Alert>;

  return (
    <Stack spacing={2} alignItems="center">
      <CircularProgress />
      <Typography color="text.secondary">{t('verifying')}</Typography>
    </Stack>
  );
}
