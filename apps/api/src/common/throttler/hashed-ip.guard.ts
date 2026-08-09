import { Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import type { Request } from 'express';

/**
 * S-7 — rate limiting without holding an address.
 *
 * The stock guard tracks by `req.ip`, which would put raw client IPs into the
 * rate-limit store — a second, undeclared copy of exactly the data §8 promises
 * not to keep. This tracks by the peppered hash that RequestContextMiddleware
 * has already derived, which is just as unique per client and reversible by
 * nobody.
 */
@Injectable()
export class HashedIpThrottlerGuard extends ThrottlerGuard {
  protected override async getTracker(request: Request): Promise<string> {
    // Always the address hash, never the account: this guard runs before the
    // session is resolved, so `request.user` is not populated here yet.
    return request.ipHash ?? 'unknown';
  }

  /**
   * The default message is "ThrottlerException: Too Many Requests" — a class
   * name from a library, shown to whoever hit the limit. Someone who has just
   * written why they choose peace deserves a sentence, not a stack-trace noun.
   */
  protected override async throwThrottlingException(): Promise<void> {
    throw new ThrottlerException(
      'That is several submissions in a short time. Please wait a little and try again.',
    );
  }
}
