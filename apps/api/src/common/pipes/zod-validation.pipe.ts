import { BadRequestException, PipeTransform } from '@nestjs/common';
import type { ZodSchema } from 'zod';

/**
 * Validates a payload against a schema from @peace/shared, so the API enforces
 * exactly the limits the UI displays. A drift between the two would let one
 * party submit a longer statement than the other — a symmetry break (D-3).
 */
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: result.error.issues.map(
          (issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`,
        ),
      });
    }
    return result.data;
  }
}

/** Convenience factory so controllers read as `@Body(zodBody(schema))`. */
export function zodBody<T>(schema: ZodSchema<T>): ZodValidationPipe<T> {
  return new ZodValidationPipe(schema);
}
