import { Body, Controller, Get, HttpCode, Post, Query, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { createVoiceSchema, withdrawVoiceSchema, type CreateVoiceData } from '@peace/shared';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { zodBody } from '../../common/pipes/zod-validation.pipe';
import { VoiceCounterService } from './voice-counter.service';
import { VoiceService } from './voice.service';

@Controller('voices')
export class VoiceController {
  constructor(
    private readonly voices: VoiceService,
    private readonly counter: VoiceCounterService,
  ) {}

  /**
   * A-4 — the single global count. Note the absence of any query parameter:
   * this endpoint cannot be asked for a breakdown, because none exists.
   */
  @Public()
  @Get('count')
  async count() {
    return this.counter.get();
  }

  /** A-5 — the public Wall of Voices, in randomised order. */
  @Public()
  @Get()
  async wall(
    @Req() request: Request,
    @Query('limit') limit = '24',
    @Query('offset') offset = '0',
  ) {
    const take = Math.min(Math.max(Number(limit) || 24, 1), 48);
    const skip = Math.max(Number(offset) || 0, 0);
    const items = await this.voices.wall(request.displaySeed ?? 'wall', take, skip);
    return { items, nextOffset: items.length === take ? skip + take : null };
  }

  /**
   * A-1/A-8 — open to anyone, rate limited per address hash. Verification is
   * never required for a Voice to be counted.
   */
  @Public()
  @Post()
  @Throttle({ default: { limit: 3, ttl: 3600_000 } })
  async submit(
    @Body(zodBody(createVoiceSchema)) dto: CreateVoiceData,
    @Req() request: Request,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.voices.submit(dto, {
      ipHash: request.ipHash,
      // Validated by the schema above, so it can never reach the mailer with a
      // line break in it.
      email: dto.email || undefined,
      locale: dto.locale ?? user?.locale ?? 'en',
      userId: user?.id,
    });
  }

  /** A-9 — withdrawal by token alone; no account, no sign-in. */
  @Public()
  @Post('withdraw')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 3600_000 } })
  async withdraw(@Body(zodBody(withdrawVoiceSchema)) dto: { token: string }) {
    await this.voices.withdraw(dto.token);
    return { status: 'withdrawn' };
  }
}
