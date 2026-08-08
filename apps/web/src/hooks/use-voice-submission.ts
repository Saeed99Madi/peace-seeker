'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CreateVoiceInput } from '@peace/shared';
import { apiFetch } from '@/lib/api-client';

const QUEUE_KEY = 'peace.voice.queue';

type Status = 'idle' | 'submitting' | 'queued' | 'done' | 'error';

export interface VoicePayload extends CreateVoiceInput {
  email?: string;
}

function readQueue(): VoicePayload[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') as VoicePayload[];
  } catch {
    return [];
  }
}

function writeQueue(items: VoicePayload[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

/**
 * §7, Offline tolerance — "Voice submission and draft writing queue locally and
 * sync when connectivity returns".
 *
 * Someone on an intermittent connection in a conflict zone should not lose what
 * they wrote because the network dropped mid-request. A failed submission is
 * kept on the device and retried when the browser reports it is back online.
 */
export function useVoiceSubmission() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(async (payload: VoicePayload) => {
    await apiFetch('/voices', { method: 'POST', body: payload });
  }, []);

  const flush = useCallback(async () => {
    const queued = readQueue();
    if (queued.length === 0) return;

    const remaining: VoicePayload[] = [];
    for (const item of queued) {
      try {
        await send(item);
      } catch {
        remaining.push(item);
      }
    }
    writeQueue(remaining);
  }, [send]);

  useEffect(() => {
    void flush();
    window.addEventListener('online', flush);
    return () => window.removeEventListener('online', flush);
  }, [flush]);

  const submit = useCallback(
    async (payload: VoicePayload) => {
      setStatus('submitting');
      setError(null);
      try {
        await send(payload);
        setStatus('done');
        return 'sent' as const;
      } catch (caught) {
        // Offline, or the server is unreachable: keep it rather than lose it.
        if (!navigator.onLine) {
          writeQueue([...readQueue(), payload]);
          setStatus('queued');
          return 'queued' as const;
        }
        setError(caught instanceof Error ? caught.message : 'unknown');
        setStatus('error');
        return 'failed' as const;
      }
    },
    [send],
  );

  return { submit, status, error };
}
