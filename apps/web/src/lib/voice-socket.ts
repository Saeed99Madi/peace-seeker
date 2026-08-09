import type { VoiceCount } from '@peace/shared';
import type { PublicVoice } from './voices';

export type Frame =
  | { type: 'count'; data: VoiceCount }
  | { type: 'voice'; data: PublicVoice }
  | { type: 'ping' };

const RECONNECT_MIN_MS = 2_000;
const RECONNECT_MAX_MS = 60_000;

/**
 * The server sends a frame every 25s. Nothing at all for this long means the
 * connection is dead in a way that produces no close event — a proxy dropped it
 * silently — so the page must decide that for itself rather than sit believing
 * it is still connected.
 */
const SILENCE_MS = 70_000;

/**
 * One WebSocket for the whole page, however many components are listening.
 *
 * This lives outside React because the count in the hero, the field of marks
 * beneath it and the Wall of arrivals are three components watching one stream.
 * A hook that opened its own socket would open three, and a reader on a poor
 * connection would pay three times to learn the same thing. Subscribers are
 * counted; the socket opens on the first and closes after the last.
 */
type Listener = (frame: Frame) => void;

const listeners = new Set<Listener>();
let socket: WebSocket | null = null;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
let watchdog: ReturnType<typeof setTimeout> | undefined;
let attempt = 0;

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

function armWatchdog() {
  if (watchdog) clearTimeout(watchdog);
  watchdog = setTimeout(() => socket?.close(), SILENCE_MS);
}

function scheduleRetry() {
  if (listeners.size === 0) return;
  // Full jitter. Without it every reader reconnects on the same beat after a
  // deploy, and the herd arrives together — which is the moment the API is
  // least able to take it.
  const ceiling = Math.min(RECONNECT_MIN_MS * 2 ** attempt, RECONNECT_MAX_MS);
  attempt += 1;
  retryTimer = setTimeout(connect, Math.random() * ceiling);
}

function connect() {
  const url = socketUrl();
  if (!url || typeof WebSocket === 'undefined') return;
  if (socket) return;

  socket = new WebSocket(url);
  armWatchdog();

  socket.onopen = () => {
    attempt = 0;
    armWatchdog();
  };
  socket.onmessage = (event) => {
    armWatchdog();
    try {
      const frame = JSON.parse(String(event.data)) as Frame;
      if (frame.type === 'ping') return; // liveness only; nothing to deliver
      for (const listener of listeners) listener(frame);
    } catch {
      // A malformed frame is not worth breaking the page over.
    }
  };
  socket.onclose = () => {
    socket = null;
    if (watchdog) clearTimeout(watchdog);
    scheduleRetry();
  };
  socket.onerror = () => socket?.close();
}

/** A sleeping laptop's socket is dead on waking; do not make the reader wait. */
function reviveNow() {
  if (socket || listeners.size === 0) return;
  if (document.visibilityState === 'hidden') return;
  if (retryTimer) clearTimeout(retryTimer);
  attempt = 0;
  connect();
}

let wired = false;
function wireRevival() {
  if (wired) return;
  wired = true;
  document.addEventListener('visibilitychange', reviveNow);
  window.addEventListener('online', reviveNow);
}

/** Returns an unsubscribe function. The socket closes when the last one goes. */
export function subscribeToVoices(listener: Listener): () => void {
  // §7 low-data mode: a persistent connection is exactly what a reader asking
  // their browser to save data is trying to avoid.
  if (typeof window === 'undefined') return () => {};
  if (window.matchMedia?.('(prefers-reduced-data: reduce)').matches) return () => {};

  listeners.add(listener);
  wireRevival();
  if (listeners.size === 1) connect();

  return () => {
    listeners.delete(listener);
    if (listeners.size > 0) return;
    if (retryTimer) clearTimeout(retryTimer);
    if (watchdog) clearTimeout(watchdog);
    retryTimer = undefined;
    watchdog = undefined;
    attempt = 0;
    const open = socket;
    socket = null;
    open?.close();
  };
}
