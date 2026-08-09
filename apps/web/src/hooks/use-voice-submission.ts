'use client';

import { useCallback, useState } from 'react';
import { ApiError, apiFetch } from '@/lib/api-client';
import { enqueue, type QueuedVoice } from '@/lib/voice-queue';

export type SubmitStatus = 'idle' | 'submitting' | 'queued' | 'done' | 'error';
export type VoicePayload = QueuedVoice;

/**
 * §7, Offline tolerance — a submission is never lost.
 *
 * Two failures, two answers:
 *
 *  - The server answered and refused (a word limit, a rate limit). Retrying
 *    changes nothing, so the person is told what the server said.
 *  - The server could not be reached — offline, or down. The words are kept on
 *    the device, and VoiceQueueFlusher retries them on any page.
 *
 * The second case previously required `navigator.onLine` to be false, so a
 * working network and an unreachable server lost the submission outright.
 */
export function useVoiceSubmission() {
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  const submit = useCallback(async (payload: VoicePayload) => {
    setStatus('submitting');
    setError(null);
    setErrorStatus(null);
    try {
      await apiFetch('/voices', { method: 'POST', body: payload });
      setStatus('done');
      return 'sent' as const;
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
        setErrorStatus(caught.status);
        setStatus('error');
        return 'refused' as const;
      }
      enqueue(payload);
      setStatus('queued');
      return 'queued' as const;
    }
  }, []);

  return { submit, status, error, errorStatus };
}
