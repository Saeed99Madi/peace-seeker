'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ApiError, apiFetch } from '@/lib/api-client';

type Status = 'idle' | 'working' | 'done' | 'error';

/**
 * The shared shape of every write in the app: attempt, show what the server
 * said if it refused, and never leave the reader looking at a spinner.
 *
 * Server messages are shown verbatim when the API refused for a stated reason
 * (a word limit, an expired link), because those messages are written for the
 * person and translating them again in the client would only blur them.
 */
export function useSubmit<T = unknown>(path: string, method: 'POST' | 'PATCH' = 'POST') {
  const t = useTranslations('common');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<T | null>(null);

  const run = useCallback(
    async (body: unknown) => {
      setStatus('working');
      setError(null);
      try {
        setResult(await apiFetch<T>(path, { method, body }));
        setStatus('done');
        return true;
      } catch (caught) {
        setError(caught instanceof ApiError ? caught.message : t('errors.generic'));
        setStatus('error');
        return false;
      }
    },
    [method, path, t],
  );

  return { run, status, error, result };
}
