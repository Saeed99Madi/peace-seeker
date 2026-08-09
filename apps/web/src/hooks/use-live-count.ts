'use client';

import { useEffect, useRef, useState } from 'react';
import type { VoiceCount } from '@peace/shared';

const RECONNECT_MIN_MS = 2_000;
const RECONNECT_MAX_MS = 60_000;

function socketUrl(): string | null {
  const api = process.env.NEXT_PUBLIC_API_URL;
  if (!api) return null;
  try {
    const url = new URL(api);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.pathname = '/live';
    url.search = '';
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * A-4 — the global count, kept current while the page is open.
 *
 * The page is statically generated and served from a CDN (§7), so the number it
 * was built with may be minutes old. This corrects it on connect and then
 * follows it live, without giving up the static page.
 *
 * The browser's own WebSocket, no library: socket.io would add about 40 KB to a
 * page already over its byte budget, to do less than this.
 *
 * It degrades to silence. If the socket cannot open, the server-rendered number
 * simply stays — a counter that is a minute stale is fine; a page that breaks
 * because a socket failed is not.
 */
export function useLiveVoiceCount(initial: VoiceCount): VoiceCount {
  const [count, setCount] = useState(initial);
  const attempt = useRef(0);

  useEffect(() => {
    // §7 low-data mode: a persistent connection is exactly what someone asking
    // their browser to save data is trying to avoid.
    if (window.matchMedia?.('(prefers-reduced-data: reduce)').matches) return;

    const url = socketUrl();
    if (!url || typeof WebSocket === 'undefined') return;

    let socket: WebSocket | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let closed = false;

    const connect = () => {
      if (closed) return;
      socket = new WebSocket(url);

      socket.onopen = () => {
        attempt.current = 0;
      };
      socket.onmessage = (event) => {
        try {
          const next = JSON.parse(String(event.data)) as VoiceCount;
          // Only ever a total and a breadth figure; anything else is ignored.
          if (typeof next?.total === 'number') setCount(next);
        } catch {
          // A malformed frame is not worth breaking the page over.
        }
      };
      socket.onclose = () => {
        if (closed) return;
        // Backing off matters: a server restart must not be met with every
        // open page reconnecting at once.
        const delay = Math.min(RECONNECT_MIN_MS * 2 ** attempt.current, RECONNECT_MAX_MS);
        attempt.current += 1;
        timer = setTimeout(connect, delay);
      };
      socket.onerror = () => socket?.close();
    };

    connect();
    return () => {
      closed = true;
      if (timer) clearTimeout(timer);
      socket?.close();
    };
  }, []);

  return count;
}
