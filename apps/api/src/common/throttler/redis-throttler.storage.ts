import { Injectable, Logger } from '@nestjs/common';
import type { ThrottlerStorage } from '@nestjs/throttler';
import type { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import { RedisService } from '../../redis/redis.service';

/**
 * A-8 — rate limiting that holds across every instance.
 *
 * The in-memory default counts per process, so N replicas permit N times the
 * intended rate. Counters live in Redis instead, keyed by the *hashed* address
 * (see RedisThrottlerGuard) so that not even the rate limiter holds an IP.
 */
@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  private readonly logger = new Logger(RedisThrottlerStorage.name);
  private readonly fallback = new Map<string, { hits: number; expiresAt: number }>();

  constructor(private readonly redis: RedisService) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const redisKey = `throttle:${throttlerName}:${key}`;
    const blockKey = `${redisKey}:blocked`;
    const client = this.redis.connection;

    if (!client) return this.incrementInMemory(redisKey, ttl, limit, blockDuration);

    try {
      const blockedFor = await client.pttl(blockKey);
      if (blockedFor > 0) {
        return { totalHits: limit + 1, timeToExpire: 0, isBlocked: true, timeToBlockExpire: Math.ceil(blockedFor / 1000) };
      }

      const [[, hits], [, remaining]] = (await client
        .multi()
        .incr(redisKey)
        .pttl(redisKey)
        .exec()) as [[Error | null, number], [Error | null, number]];

      // PTTL of -1 means the key exists without an expiry: the first hit of a
      // window, or a key that lost its TTL. Either way, (re)apply it.
      let timeToExpire = remaining;
      if (remaining < 0) {
        await client.pexpire(redisKey, ttl);
        timeToExpire = ttl;
      }

      if (hits > limit) {
        await client.set(blockKey, '1', 'PX', blockDuration || ttl);
        return { totalHits: hits, timeToExpire: 0, isBlocked: true, timeToBlockExpire: Math.ceil((blockDuration || ttl) / 1000) };
      }

      return { totalHits: hits, timeToExpire: Math.ceil(timeToExpire / 1000), isBlocked: false, timeToBlockExpire: 0 };
    } catch (error) {
      // A rate limiter that fails closed takes the whole platform down with
      // Redis. It fails open instead — loudly, because an unlogged silent
      // failure here is how abuse protection quietly stops existing.
      this.logger.error(`Redis throttling failed, falling back to in-process counters: ${String(error)}`);
      return this.incrementInMemory(redisKey, ttl, limit, blockDuration);
    }
  }

  private incrementInMemory(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
  ): ThrottlerStorageRecord {
    const now = Date.now();
    const entry = this.fallback.get(key);
    if (!entry || entry.expiresAt <= now) {
      this.fallback.set(key, { hits: 1, expiresAt: now + ttl });
      return { totalHits: 1, timeToExpire: Math.ceil(ttl / 1000), isBlocked: false, timeToBlockExpire: 0 };
    }
    entry.hits += 1;
    const blocked = entry.hits > limit;
    return {
      totalHits: entry.hits,
      timeToExpire: Math.ceil((entry.expiresAt - now) / 1000),
      isBlocked: blocked,
      timeToBlockExpire: blocked ? Math.ceil((blockDuration || ttl) / 1000) : 0,
    };
  }
}
