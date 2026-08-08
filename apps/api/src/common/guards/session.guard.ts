import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SESSION_COOKIE, SessionService } from '../../modules/auth/session.service';

/**
 * Resolves the session cookie into `request.user`.
 *
 * On a @Public route the guard still resolves an existing session — the Wall of
 * Voices and the charter look the same to everyone, but a signed-in reader
 * should not appear signed out (A-1 keeps those routes open to all).
 */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessions: SessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const token = request.cookies?.[SESSION_COOKIE] as string | undefined;
    if (token) {
      const user = await this.sessions.resolve(token);
      if (user) request.user = user;
    }

    if (isPublic) return true;
    if (!request.user) throw new UnauthorizedException('Please sign in to continue.');
    return true;
  }
}
