import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Keyed hashing. A plain SHA-256 of an email address or an IP is trivially
 * reversible by dictionary attack, which would defeat S-7 entirely; every
 * identifier hash here is HMAC'd with a server-side pepper.
 */
export function keyedHash(value: string, pepper: string): string {
  return createHmac('sha256', pepper).update(value.trim().toLowerCase()).digest('hex');
}

/** Unkeyed digest, for values that are already high-entropy secrets (tokens). */
export function tokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** URL-safe random token used for sessions, magic links, withdrawal links. */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/** Constant-time comparison, so token checks do not leak length or prefix. */
export function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

/**
 * A short, non-sequential public reference (e.g. for a case). Sequential ids
 * would leak volume and ordering information about other people's cases.
 */
export function publicReference(prefix: string): string {
  return `${prefix}-${randomBytes(5).toString('hex').toUpperCase()}`;
}
