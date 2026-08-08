import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { UnprocessableEntityException } from '@nestjs/common';
import { findProhibitedFields } from '@peace/shared';
import type { Request } from 'express';

/**
 * B-3 / §3.1 — a structural backstop.
 *
 * DTO validation already strips unknown properties, so in a correct build this
 * guard never fires. It exists for the build that is not correct: the day
 * someone adds `nationality` to a DTO "just for analytics", every request
 * carrying that field fails loudly instead of quietly populating a column that
 * makes group comparison possible.
 */
@Injectable()
export class ProhibitedFieldsGuard implements CanActivate {
  private readonly logger = new Logger(ProhibitedFieldsGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const found = [
      ...findProhibitedFields(request.body),
      ...findProhibitedFields(request.query),
    ];

    if (found.length > 0) {
      const unique = [...new Set(found)];
      this.logger.error(
        `Rejected request to ${request.method} ${request.path}: prohibited field(s) ${unique.join(', ')}`,
      );
      throw new UnprocessableEntityException({
        message:
          'This request contains a field the platform is not permitted to collect. ' +
          'See the Founding Vision, §3.1 (Symmetry) and requirement B-3.',
        fields: unique,
      });
    }

    return true;
  }
}
