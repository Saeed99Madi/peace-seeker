import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { keyedHash } from '../utils/hash.util';

/**
 * S-7 — minimal logging.
 *
 * The raw client IP never leaves this middleware. Downstream code receives a
 * peppered hash for rate limiting and duplicate detection, plus an opaque
 * request id for support correlation. Nothing else in the application has any
 * way to obtain the address.
 */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly config: ConfigService) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const requestId = randomUUID();
    request.requestId = requestId;
    response.setHeader('x-request-id', requestId);

    const pepper = this.config.get<string>('ipHashPepper') ?? '';
    const address = request.ip ?? '';
    request.ipHash = address ? keyedHash(address, pepper) : undefined;

    // A per-visitor seed for randomised display order (A-5). Derived from the
    // IP hash and the day, so ordering is stable for one reader for one day
    // and differs between readers — without any identifier being stored.
    const day = new Date().toISOString().slice(0, 10);
    request.displaySeed = keyedHash(`${request.ipHash ?? requestId}:${day}`, pepper);

    next();
  }
}
