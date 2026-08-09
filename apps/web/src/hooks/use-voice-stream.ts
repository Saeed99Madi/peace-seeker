'use client';

import { useEffect, useState } from 'react';
import type { VoiceCount } from '@peace/shared';
import { subscribeToVoices } from '@/lib/voice-socket';
import type { PublicVoice } from '@/lib/voices';

/**
 * The live count, and voices as they arrive, from the page's shared socket.
 *
 * Nothing here polls. If the socket cannot open, the page keeps the figures it
 * was server-rendered with and simply stops moving — which is the correct
 * failure: a stale true number beats a spinner.
 */
export function useVoiceStream(initial: VoiceCount) {
  const [count, setCount] = useState(initial);
  const [arrived, setArrived] = useState<PublicVoice[]>([]);

  useEffect(
    () =>
      subscribeToVoices((frame) => {
        if (frame.type === 'count' && typeof frame.data?.total === 'number') {
          // Never let the figure go backwards. Two voices published at the same
          // moment produce two counts, and Redis gives no ordering guarantee
          // across them — a reader must not watch the number tick down.
          setCount((current) => (frame.data.asOf >= current.asOf ? frame.data : current));
        }
        // Cap what is held in memory: a page left open for a day must not grow
        // without limit.
        if (frame.type === 'voice' && frame.data?.id) {
          setArrived((current) => [frame.data, ...current].slice(0, 30));
        }
      }),
    [],
  );

  return { count, arrived };
}
