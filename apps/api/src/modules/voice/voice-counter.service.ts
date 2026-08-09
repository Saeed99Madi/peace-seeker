import { Injectable, Logger } from '@nestjs/common';
import type { VoiceCount } from '@peace/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

/** The channel the live counter listens on. */
export const VOICE_COUNT_CHANNEL = 'voices:count';
/** A newly published voice, in its public form. */
export const VOICE_ARRIVED_CHANNEL = 'voices:arrived';

const CACHE_KEY = 'voices:count';
const CACHE_TTL_SECONDS = 15;

/**
 * A-4 — one global counter, and only one.
 *
 * There is no method here that accepts a country, a language or any other
 * grouping, and no table it could read one from. That is the point: a per-group
 * count would turn the platform into a scoreboard, which §3.1 names as the
 * opposite of its purpose.
 *
 * Per the scalability requirement the number is served from cache rather than
 * an aggregate query over a million rows — from Redis, so that every instance
 * gives the same answer, with an in-process copy behind it for the seconds when
 * Redis is unreachable.
 */
@Injectable()
export class VoiceCounterService {
  private readonly logger = new Logger(VoiceCounterService.name);
  private local: { value: VoiceCount; at: number } | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async get(): Promise<VoiceCount> {
    if (this.local && Date.now() - this.local.at < CACHE_TTL_SECONDS * 1000) {
      return this.local.value;
    }

    const client = this.redis.connection;
    if (client) {
      try {
        const cached = await client.get(CACHE_KEY);
        if (cached) {
          const value = JSON.parse(cached) as VoiceCount;
          this.local = { value, at: Date.now() };
          return value;
        }
      } catch (error) {
        this.logger.warn(`Counter cache read failed: ${String(error)}`);
      }
    }

    const row = await this.prisma.voiceCounter.findUnique({ where: { id: 1 } });
    const value: VoiceCount = {
      total: row?.total ?? 0,
      countriesRepresented: row?.countriesRepresented ?? 0,
      asOf: (row?.updatedAt ?? new Date()).toISOString(),
    };

    await client?.set(CACHE_KEY, JSON.stringify(value), 'EX', CACHE_TTL_SECONDS).catch(() => undefined);
    this.local = { value, at: Date.now() };
    return value;
  }

  /** Called when a Voice is published or withdrawn.
   *
   * Note what withdrawal does *not* do: it never removes a country from
   * `CountryPresence`, so the breadth figure only ever grows. Removing one
   * would mean asking "how many voices remain from country X" — the exact
   * per-group count this design exists to make impossible (§3.1). The figure is
   * therefore "countries this platform has been heard from".
   */
  async adjust(delta: number, newCountry?: string | null): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      if (newCountry) {
        await tx.countryPresence.upsert({
          where: { country: newCountry },
          create: { country: newCountry },
          update: {},
        });
      }
      const countries = await tx.countryPresence.count();
      await tx.voiceCounter.upsert({
        where: { id: 1 },
        create: { id: 1, total: Math.max(delta, 0), countriesRepresented: countries },
        update: { total: { increment: delta }, countriesRepresented: countries },
      });
    });
    await this.invalidate();
    // Announce it, rather than call the gateway directly. The counter must not
    // know that anything is watching: it publishes, the gateway subscribes, and
    // the dependency runs one way only.
    await this.redis.publish(VOICE_COUNT_CHANNEL, await this.get());
  }

  /** Repairs the cached total from the source of truth (run after a restore). */
  async reconcile(): Promise<VoiceCount> {
    const [total, countries] = await this.prisma.$transaction([
      this.prisma.voice.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.countryPresence.count(),
    ]);
    await this.prisma.voiceCounter.upsert({
      where: { id: 1 },
      create: { id: 1, total, countriesRepresented: countries },
      update: { total, countriesRepresented: countries },
    });
    await this.invalidate();
    this.logger.log(`Counter reconciled: ${total} voices, ${countries} countries`);
    return this.get();
  }

  private async invalidate(): Promise<void> {
    this.local = null;
    await this.redis.connection?.del(CACHE_KEY).catch(() => undefined);
  }
}
