import { createHash } from 'node:crypto';

/**
 * A-5 / §3.1 — randomised display order, so that no message and no origin is
 * privileged, and so that the order of two parties is never fixed.
 *
 * The shuffle is seeded rather than truly random: a reader paging through the
 * Wall of Voices needs a stable order within their session (otherwise the same
 * voice appears on page 1 and page 3), while a different reader — or the same
 * reader tomorrow — sees a different order.
 */
function seedToInt(seed: string): number {
  const digest = createHash('sha256').update(seed).digest();
  return digest.readUInt32BE(0) || 1;
}

/** Mulberry32 — small, fast, and deterministic for a given seed. */
function createRandom(seed: string): () => number {
  let state = seedToInt(seed);
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const random = createRandom(seed);
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * §3.1 — the order in which two parties are presented is randomised per
 * session, never fixed. There is no "Party A always on the left".
 */
export function orderPartiesForDisplay<T>(a: T, b: T, seed: string): [T, T] {
  return createRandom(seed)() < 0.5 ? [a, b] : [b, a];
}
