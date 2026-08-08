import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerStorage } from '@nestjs/throttler';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { MailModule } from './mail/mail.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { CommunityModule } from './modules/community/community.module';
import { FlagsModule } from './modules/flags/flags.module';
import { HealthModule } from './modules/health/health.module';
import { MediaModule } from './modules/media/media.module';
import { MembersModule } from './modules/members/members.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { PathModule } from './modules/path/path.module';
import { RetentionModule } from './modules/retention/retention.module';
import { StatsModule } from './modules/stats/stats.module';
import { VoiceModule } from './modules/voice/voice.module';
import { CsrfGuard } from './common/guards/csrf.guard';
import { ProhibitedFieldsGuard } from './common/guards/prohibited-fields.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { SessionGuard } from './common/guards/session.guard';
import { JsonLogger } from './common/logging/json.logger';
import { HashedIpThrottlerGuard } from './common/throttler/hashed-ip.guard';
import { RedisThrottlerStorage } from './common/throttler/redis-throttler.storage';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], validate: validateEnv }),
    // A-8 — a global floor on request rate; individual routes tighten it.
    ThrottlerModule.forRoot({ throttlers: [{ name: 'default', ttl: 60_000, limit: 120 }] }),
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    MailModule,
    AuditModule,
    FlagsModule,
    AuthModule,
    HealthModule,
    VoiceModule,
    MembersModule,
    MediaModule,
    ModerationModule,
    CommunityModule,
    PathModule,
    StatsModule,
    RetentionModule,
  ],
  providers: [
    JsonLogger,
    // Counters live in Redis so the limit holds across every instance.
    { provide: ThrottlerStorage, useClass: RedisThrottlerStorage },
    RedisThrottlerStorage,
    // Order matters: throttle first (cheapest rejection), then reject any
    // prohibited field (B-3) before authentication work is done, then CSRF,
    // then resolve the session, then check roles.
    { provide: APP_GUARD, useClass: HashedIpThrottlerGuard },
    { provide: APP_GUARD, useClass: ProhibitedFieldsGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
    { provide: APP_GUARD, useClass: SessionGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
