import { ConsoleLogger, Injectable, LogLevel, Scope } from '@nestjs/common';

/**
 * Structured logs in production, readable ones in development.
 *
 * Log aggregation is the easiest place for member data to end up somewhere
 * nobody audited, so this logger does two things deliberately: it emits JSON
 * that a collector can filter precisely, and it redacts anything that looks
 * like an address or a token before it is written (S-7).
 */
const REDACTIONS: Array<[RegExp, string]> = [
  [/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email]'],
  [/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[ip]'],
  [/\b[A-Za-z0-9_-]{32,}\b/g, '[token]'],
];

export function redact(message: string): string {
  return REDACTIONS.reduce((text, [pattern, mask]) => text.replace(pattern, mask), message);
}

@Injectable({ scope: Scope.DEFAULT })
export class JsonLogger extends ConsoleLogger {
  private readonly asJson = process.env.NODE_ENV === 'production';

  protected override printMessages(
    messages: unknown[],
    context = '',
    logLevel: LogLevel = 'log',
  ): void {
    if (!this.asJson) return super.printMessages(messages, context, logLevel);

    for (const message of messages) {
      const text = typeof message === 'string' ? message : JSON.stringify(message);
      process.stdout.write(
        `${JSON.stringify({
          level: logLevel,
          time: new Date().toISOString(),
          context: context || undefined,
          message: redact(text ?? ''),
        })}\n`,
      );
    }
  }
}
