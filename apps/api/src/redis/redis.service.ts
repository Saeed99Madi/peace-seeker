import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Shared Redis connection.
 *
 * Two things in this application are only correct when they are shared across
 * every process: the rate limiter (A-8) and the Voice counter (A-4). Held in
 * process memory, both silently multiply by the number of instances — three
 * replicas would mean three times the permitted request rate, and three
 * different answers to "how many voices are there".
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private sub: Redis | null = null;
  private healthy = false;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const url = this.config.get<string>('redisUrl');
    if (!url) return;

    this.client = new Redis(url, {
      maxRetriesPerRequest: 2,
      enableOfflineQueue: false,
      lazyConnect: false,
      retryStrategy: (attempt) => Math.min(attempt * 250, 5000),
    });

    this.client.on('ready', () => {
      this.healthy = true;
      this.logger.log('Redis connection established');
    });
    this.client.on('error', (error: Error) => {
      if (this.healthy) this.logger.error(`Redis unavailable: ${error.message}`);
      this.healthy = false;
    });
  }

  /**
   * A second connection, for subscribing.
   *
   * Redis puts a subscriber connection into a mode where it accepts nothing but
   * subscribe commands, so the shared client cannot be reused for it. This is
   * what lets a Voice added on one instance reach the readers connected to
   * another (§7, more than one replica).
   */
  subscriber(): Redis | null {
    if (!this.client) return null;
    // The offline queue is disabled on the main client so a request fails fast
    // rather than hanging. A subscriber is the opposite case: it is set up once
    // at boot, before the socket is necessarily open, and its subscribe call
    // should wait rather than throw and take the process down with it.
    if (!this.sub) {
      this.sub = this.client.duplicate({ enableOfflineQueue: true });
      // Attached once, with the connection. Attaching it on every call to this
      // method would add a listener per caller and eventually trip Node's
      // max-listeners warning — which is how a leak announces itself.
      this.sub.on('error', () => undefined);
    }
    return this.sub;
  }

  async publish(channel: string, payload: unknown): Promise<void> {
    await this.connection?.publish(channel, JSON.stringify(payload)).catch(() => undefined);
  }

  async onModuleDestroy(): Promise<void> {
    await this.sub?.quit().catch(() => undefined);
    await this.client?.quit().catch(() => undefined);
  }

  /** Null while Redis is unreachable; every caller must handle that case. */
  get connection(): Redis | null {
    return this.client && this.healthy ? this.client : null;
  }

  get isHealthy(): boolean {
    return this.healthy;
  }

  async ping(): Promise<boolean> {
    try {
      return (await this.connection?.ping()) === 'PONG';
    } catch {
      return false;
    }
  }
}
