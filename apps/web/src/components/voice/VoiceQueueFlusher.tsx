'use client';

import { useEffect } from 'react';
import { flushQueue } from '@/lib/voice-queue';

/**
 * Mounted once in the layout, so a voice held on the device is retried on any
 * page — not only on the form that created it.
 *
 * Renders nothing. It exists because the promise made to someone submitting on
 * a bad connection ("saved on this device and sent as soon as you are
 * connected") has to be true wherever they go next.
 */
export function VoiceQueueFlusher() {
  useEffect(() => {
    void flushQueue();
    const retry = () => void flushQueue();
    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
  }, []);

  return null;
}
