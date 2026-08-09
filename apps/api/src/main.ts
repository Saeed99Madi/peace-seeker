import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { JsonLogger } from './common/logging/json.logger';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  const isProduction = config.get<boolean>('isProduction');

  app.useLogger(app.get(JsonLogger));

  // Native WebSocket, not socket.io: the client then needs no library at all,
  // which matters on a page already over its byte budget (§7).
  app.useWebSocketAdapter(new WsAdapter(app));

  /**
   * S-7 / A-8 — behind a load balancer, `req.ip` is the balancer unless Express
   * is told how many proxies to look through. Left unset, every visitor shares
   * one address: rate limiting becomes global and the peppered address hash
   * becomes a constant. Set to the exact hop count rather than `true`, because
   * trusting the whole chain lets a client forge X-Forwarded-For.
   */
  app.set('trust proxy', config.get<number>('trustedProxyHops') ?? 0);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          // S-6 — no third-party trackers anywhere. Nothing off-origin loads.
          scriptSrc: ["'self'"],
          connectSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          mediaSrc: ["'self'", 'blob:'],
          styleSrc: ["'self'", "'unsafe-inline'"],
          frameAncestors: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'none'"],
          formAction: ["'self'"],
          ...(isProduction ? { upgradeInsecureRequests: [] } : {}),
        },
      },
      hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },
      referrerPolicy: { policy: 'no-referrer' },
      crossOriginResourcePolicy: { policy: 'same-site' },
      crossOriginOpenerPolicy: { policy: 'same-origin' },
    }),
  );
  app.use(cookieParser());

  // A JSON body has no legitimate reason to be large here — the longest field
  // on the platform is a 40,000-character story. Media goes through multer,
  // which enforces its own limit.
  app.use(json({ limit: '256kb' }));
  app.use(urlencoded({ extended: false, limit: '256kb' }));

  app.enableCors({
    origin: config.get<string>('webOrigin'),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    maxAge: 600,
  });

  app.setGlobalPrefix('api');
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      // B-3 — an unexpected property is an error, not something to drop quietly.
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.get(PrismaService).enableShutdownHooks(app);
  app.enableShutdownHooks();

  const port = config.get<number>('port') ?? 4000;
  await app.listen(port, '0.0.0.0');
  new Logger('Bootstrap').log(
    `Peace Seekers API listening on :${port} (${config.get<string>('nodeEnv')})`,
  );
}

void bootstrap();
