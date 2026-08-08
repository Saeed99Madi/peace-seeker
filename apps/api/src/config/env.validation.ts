import { z } from 'zod';

/**
 * The process refuses to start with weak, missing or duplicated secrets.
 *
 * Members of this platform may be exposed to surveillance, detention or worse
 * as a consequence of being here (§8). A misconfigured deployment is not an
 * inconvenience to be discovered in production — it is a safety incident. So
 * every check below is fatal rather than a warning.
 */
const secret = z.string().min(32, 'must be at least 32 characters');

/** Values shipped in .env.example and .env. Useful locally, fatal in production. */
const DEV_SECRET_MARKERS = ['change-me', 'dev-only', 'ci-only', 'insecure', 'example'];

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  WEB_ORIGIN: z.string().url(),
  API_PUBLIC_URL: z.string().url(),
  /** How many proxies sit in front of this process (see main.ts, trust proxy). */
  TRUSTED_PROXY_HOPS: z.coerce.number().int().min(0).max(10).default(0),
  EMAIL_HASH_PEPPER: secret,
  IP_HASH_PEPPER: secret,
  SESSION_SECRET: secret,
  MAIL_TRANSPORT: z.enum(['console', 'smtp']).default('console'),
  MAIL_FROM: z.string().min(3),
  SMTP_URL: z.string().optional(),
  CAPTCHA_PROVIDER: z.enum(['turnstile', 'hcaptcha']).optional(),
  CAPTCHA_SECRET: z.string().optional(),
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().min(2),
  S3_BUCKET: z.string().min(1),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

function assertProduction(env: Env): string[] {
  const problems: string[] = [];
  const peppers = {
    EMAIL_HASH_PEPPER: env.EMAIL_HASH_PEPPER,
    IP_HASH_PEPPER: env.IP_HASH_PEPPER,
    SESSION_SECRET: env.SESSION_SECRET,
  };

  for (const [name, value] of Object.entries(peppers)) {
    const lower = value.toLowerCase();
    if (DEV_SECRET_MARKERS.some((marker) => lower.includes(marker))) {
      problems.push(`  ${name}: still set to a development placeholder`);
    }
  }

  // Reusing one pepper across purposes means a leak of one is a leak of all,
  // and lets an email hash be correlated with an IP hash.
  if (new Set(Object.values(peppers)).size !== 3) {
    problems.push('  EMAIL_HASH_PEPPER, IP_HASH_PEPPER and SESSION_SECRET must differ from each other');
  }

  if (env.MAIL_TRANSPORT === 'console') {
    problems.push('  MAIL_TRANSPORT: "console" prints sign-in links to the server log');
  }
  if (env.MAIL_TRANSPORT === 'smtp' && !env.SMTP_URL) {
    problems.push('  SMTP_URL: required when MAIL_TRANSPORT is "smtp"');
  }
  if (env.STORAGE_DRIVER === 'local') {
    problems.push('  STORAGE_DRIVER: "local" writes uploads to the container filesystem');
  }
  if (env.CAPTCHA_PROVIDER && !env.CAPTCHA_SECRET) {
    problems.push('  CAPTCHA_SECRET: required when CAPTCHA_PROVIDER is set');
  }
  if (!env.WEB_ORIGIN.startsWith('https://')) {
    problems.push('  WEB_ORIGIN: must be https in production (session cookies are Secure)');
  }
  return problems;
}

export function validateEnv(raw: Record<string, unknown>): Record<string, unknown> {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${details}`);
  }

  if (result.data.NODE_ENV === 'production') {
    const problems = assertProduction(result.data);
    if (problems.length > 0) {
      throw new Error(`Refusing to start in production:\n${problems.join('\n')}`);
    }
  }

  return { ...raw, ...result.data };
}
