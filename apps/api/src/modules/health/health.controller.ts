import { Controller, Get, HttpCode } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { MailService } from '../../mail/mail.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly mail: MailService,
  ) {}

  /** Liveness — the process is up. Kept trivial so it never restarts a healthy
   *  instance because a dependency is briefly slow. */
  @Public()
  @Get()
  live() {
    return { status: 'ok', uptimeSeconds: Math.round(process.uptime()) };
  }

  /**
   * Readiness — should this instance receive traffic?
   *
   * The database is required. Redis is not: without it the rate limiter falls
   * back to per-process counters and the counter to a direct query, which is
   * degraded but serving — and taking the platform offline for that would be
   * the worse failure (§7, Availability).
   */
  @Public()
  @Get('ready')
  @HttpCode(200)
  async ready() {
    const database = await this.prisma
      .$queryRaw`SELECT 1`.then(() => true)
      .catch(() => false);
    const cache = await this.redis.ping();

    return {
      status: database ? 'ready' : 'degraded',
      database: database ? 'ok' : 'unreachable',
      cache: cache ? 'ok' : 'degraded',
    };
  }

  /** Deep check for deployment smoke tests — includes the mail path. */
  @Public()
  @Get('startup')
  async startup() {
    const [database, mail] = await Promise.all([
      this.prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
      this.mail.verifyConnection(),
    ]);
    return { database, cache: this.redis.isHealthy, mail };
  }
}
