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

  async onModuleDestroy(): Promise<void> {
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
