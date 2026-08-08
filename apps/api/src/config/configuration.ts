export interface AppConfig {
  nodeEnv: string;
  isProduction: boolean;
  port: number;
  webOrigin: string;
  apiPublicUrl: string;
  trustedProxyHops: number;
  databaseUrl: string;
  redisUrl: string;
  storageDriver: 'local' | 's3';
  emailHashPepper: string;
  ipHashPepper: string;
  sessionSecret: string;
  mailTransport: 'console' | 'smtp';
  mailFrom: string;
  smtpUrl?: string;
  captchaProvider?: string;
  captchaSecret?: string;
  storage: {
    endpoint: string;
    region: string;
    bucket: string;
    accessKey: string;
    secretKey: string;
  };
}

export default (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT ?? 4000),
  webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
  apiPublicUrl: process.env.API_PUBLIC_URL ?? 'http://localhost:4000',
  trustedProxyHops: Number(process.env.TRUSTED_PROXY_HOPS ?? 0),
  databaseUrl: process.env.DATABASE_URL ?? '',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  storageDriver: process.env.STORAGE_DRIVER === 's3' ? 's3' : 'local',
  emailHashPepper: process.env.EMAIL_HASH_PEPPER ?? '',
  ipHashPepper: process.env.IP_HASH_PEPPER ?? '',
  sessionSecret: process.env.SESSION_SECRET ?? '',
  mailTransport: process.env.MAIL_TRANSPORT === 'smtp' ? 'smtp' : 'console',
  mailFrom: process.env.MAIL_FROM ?? 'Peace Seekers <no-reply@localhost>',
  smtpUrl: process.env.SMTP_URL || undefined,
  captchaProvider: process.env.CAPTCHA_PROVIDER || undefined,
  captchaSecret: process.env.CAPTCHA_SECRET || undefined,
  storage: {
    endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
    region: process.env.S3_REGION ?? 'eu-central-1',
    bucket: process.env.S3_BUCKET ?? 'peace-media',
    accessKey: process.env.S3_ACCESS_KEY ?? '',
    secretKey: process.env.S3_SECRET_KEY ?? '',
  },
});
