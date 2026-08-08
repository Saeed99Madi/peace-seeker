import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * S-11 — CSRF protection for a cookie-based session.
 *
 * The session cookie is SameSite=Strict, which already blocks the classic
 * cross-site form post. This guard adds the second layer: every state-changing
 * request must carry an Origin (or Referer) belonging to the platform's own
 * web origin, so a request forged from another site fails even if a browser
 * mishandles SameSite.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.has(request.method)) return true;

    const allowed = this.config.get<string>('webOrigin');
    const origin = request.headers.origin ?? originOf(request.headers.referer);

    // No Origin at all means a non-browser client (curl, a mobile app). Those
    // cannot be CSRF'd, because there is no ambient cookie to ride on.
    if (!origin) return true;
    if (origin !== allowed) {
      throw new ForbiddenException('Request origin is not permitted.');
    }
    return true;
  }
}

function originOf(referer: string | undefined): string | undefined {
  if (!referer) return undefined;
  try {
    return new URL(referer).origin;
  } catch {
    return undefined;
  }
}
