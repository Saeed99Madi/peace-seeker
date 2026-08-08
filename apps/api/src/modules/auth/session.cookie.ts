import type { CookieOptions, Response } from 'express';
import { SESSION_COOKIE } from './session.service';

/**
 * SameSite=Strict, httpOnly, and Secure outside development. Strict rather than
 * Lax is a deliberate choice: it means a link from another site never arrives
 * carrying the member's session, which matters when the linking site may be
 * hostile (§3.3).
 */
function options(expiresAt?: Date): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  };
}

export function setSessionCookie(response: Response, token: string, expiresAt: Date): void {
  response.cookie(SESSION_COOKIE, token, options(expiresAt));
}

export function clearSessionCookie(response: Response): void {
  response.clearCookie(SESSION_COOKIE, options());
}
