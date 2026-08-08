import { Body, Controller, Delete, Get, HttpCode, Param, Post, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import {
  consumeMagicLinkSchema,
  passwordLoginSchema,
  registerSchema,
  requestMagicLinkSchema,
  setPasswordSchema,
} from '@peace/shared';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { zodBody } from '../../common/pipes/zod-validation.pipe';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';
import { setSessionCookie, clearSessionCookie } from './session.cookie';
import type { ConsumeMagicLinkDto, PasswordLoginDto, RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly sessions: SessionService,
  ) {}

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 3600_000 } })
  async register(@Body(zodBody(registerSchema)) dto: RegisterDto) {
    await this.auth.register(dto);
    // Deliberately no session here: the member proves the address first.
    return { status: 'check-your-email' };
  }

  @Public()
  @Post('magic-link')
  @HttpCode(202)
  @Throttle({ default: { limit: 5, ttl: 900_000 } })
  async magicLink(@Body(zodBody(requestMagicLinkSchema)) dto: { email: string; locale?: string }) {
    await this.auth.requestMagicLink(dto.email, dto.locale as never);
    // Same answer whether or not the address is known (see AuthService).
    return { status: 'sent-if-registered' };
  }

  @Public()
  @Post('verify')
  async verify(
    @Body(zodBody(consumeMagicLinkSchema)) dto: ConsumeMagicLinkDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const userId = await this.auth.consumeMagicLink(dto.token);
    return this.startSession(userId, request, response);
  }

  @Public()
  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 900_000 } })
  async login(
    @Body(zodBody(passwordLoginSchema)) dto: PasswordLoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const userId = await this.auth.loginWithPassword(dto.email, dto.password);
    return this.startSession(userId, request, response);
  }

  @Post('password')
  async setPassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body(zodBody(setPasswordSchema)) dto: { password: string },
  ) {
    await this.auth.setPassword(user.id, dto.password);
    return { status: 'updated' };
  }

  @Get('sessions')
  async listSessions(@CurrentUser() user: AuthenticatedUser) {
    return { items: await this.sessions.list(user.id) };
  }

  /** S-9 — remote revocation of a single device. */
  @Delete('sessions/:id')
  async revokeSession(@CurrentUser() user: AuthenticatedUser, @Param('id') sessionId: string) {
    await this.sessions.revoke(sessionId, user.id);
    return { status: 'revoked' };
  }

  @Post('logout')
  @HttpCode(204)
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.sessions.revoke(user.sessionId, user.id);
    clearSessionCookie(response);
  }

  private async startSession(userId: string, request: Request, response: Response) {
    const { token, expiresAt } = await this.sessions.create(userId, deviceLabel(request));
    setSessionCookie(response, token, expiresAt);
    return { status: 'signed-in' };
  }
}

/** A recognisable label, never a fingerprint: browser family and platform only. */
function deviceLabel(request: Request): string | undefined {
  const agent = request.headers['user-agent'];
  if (!agent) return undefined;
  const browser = /Firefox|Chrome|Safari|Edg/.exec(agent)?.[0] ?? 'Browser';
  const platform = /Android|iPhone|iPad|Windows|Macintosh|Linux/.exec(agent)?.[0] ?? 'device';
  return `${browser} on ${platform}`;
}
