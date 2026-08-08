import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { ApiError } from '@peace/shared';

/**
 * A single error shape for every endpoint. Unhandled errors are logged with a
 * request id and returned as a generic message: an internal error string can
 * disclose member content or database structure, and this platform cannot
 * afford either (§8).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Http');

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    if (!isHttp) {
      this.logger.error(
        `Unhandled error on ${request.method} ${request.path} [${request.requestId}]`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ApiError = {
      statusCode: status,
      error: HttpStatus[status] ?? 'ERROR',
      message: isHttp ? extractMessage(exception) : 'An unexpected error occurred.',
      requestId: request.requestId,
    };

    response.status(status).json(body);
  }
}

function extractMessage(exception: HttpException): string | string[] {
  const payload = exception.getResponse();
  if (typeof payload === 'string') return payload;
  if (typeof payload === 'object' && payload !== null && 'message' in payload) {
    return (payload as { message: string | string[] }).message;
  }
  return exception.message;
}
