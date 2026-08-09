import type { CreateVoiceInput } from '@peace/shared';
import { ApiError, apiFetch } from './api-client';

const QUEUE_KEY = 'peace.voice.queue';

export interface QueuedVoice extends CreateVoiceInput {
  email?: string;
}

export function readQueue(): QueuedVoice[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') as QueuedVoice[];
  } catch {
    return [];
  }
}

export function writeQueue(items: QueuedVoice[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  } catch {
    // A full or disabled store must not make a submission vanish silently.
  }
}

export function enqueue(voice: QueuedVoice): void {
  writeQueue([...readQueue(), voice]);
}

/**
 * §7 — send anything the device is still holding.
 *
 * This lives outside the form on purpose. It used to run only where the form
 * was mounted, which meant a voice written while the server was unreachable sat
 * on the device until the person happened to open that one page again. They
 * would have been told their words were saved and would be sent, and then they
 * quietly would not be. Now every page carries the retry.
 *
 * What is dropped and what is kept matters more than it looks. Only a refusal
 * about the *content* is final — a word limit or a malformed field will refuse
 * identically forever. "Too many requests" and a server error are the opposite:
 * they mean try later, and discarding on those would throw away someone's words
 * precisely when the platform is busiest, which is when a flood of people are
 * writing after something terrible has happened.
 */
function isFinalRefusal(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  if (error.status === 429 || error.status >= 500) return false;
  return error.status >= 400 && error.status < 500;
}

/**
 * Only one flush may be in flight.
 *
 * Without this, two callers — React's double-mounted effects in development,
 * two open tabs, a reconnect landing on top of a page load — each read the same
 * queue and each send it, and one person's voice is counted twice. The counter
 * is the platform's central claim (A-4); inflating it with duplicates corrupts
 * the one number the whole site is built around.
 */
let inFlight: Promise<number> | null = null;

async function drain(): Promise<number> {
  // Claim the whole queue before sending: anything that arrives mid-flush is a
  // new item, and anything that fails is put back below.
  const claimed = readQueue();
  if (claimed.length === 0) return 0;
  writeQueue([]);

  const putBack: QueuedVoice[] = [];
  let sent = 0;

  for (const voice of claimed) {
    try {
      await apiFetch('/voices', { method: 'POST', body: voice });
      sent += 1;
    } catch (caught) {
      if (!isFinalRefusal(caught)) putBack.push(voice);
    }
  }

  if (putBack.length > 0) writeQueue([...putBack, ...readQueue()]);
  return sent;
}

export function flushQueue(): Promise<number> {
  inFlight ??= drain().finally(() => {
    inFlight = null;
  });
  return inFlight;
}
