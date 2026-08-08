import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

/**
 * Object storage behind one interface: a local directory in development, an
 * S3-compatible bucket with EU residency in production (§11, S-8). Call sites
 * never learn which, so the residency requirement is satisfied by configuration
 * rather than by remembering to change feature code.
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly root = resolve(process.cwd(), 'storage');
  private s3: S3Client | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    if (this.config.get<string>('storageDriver') !== 's3') return;

    const storage = this.config.get<{
      endpoint: string;
      region: string;
      accessKey: string;
      secretKey: string;
    }>('storage');

    this.s3 = new S3Client({
      endpoint: storage?.endpoint,
      region: storage?.region ?? 'eu-central-1',
      // Required by MinIO and most non-AWS S3 implementations.
      forcePathStyle: true,
      credentials: {
        accessKeyId: storage?.accessKey ?? '',
        secretAccessKey: storage?.secretKey ?? '',
      },
    });
    this.logger.log(`Object storage: S3 at ${storage?.endpoint} (${storage?.region})`);
  }

  private get bucket(): string {
    return this.config.get<string>('storage.bucket') ?? 'peace-media';
  }

  async put(key: string, data: Buffer, contentType: string): Promise<string> {
    if (this.s3) {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: data,
          ContentType: contentType,
          // S-4 — encryption at rest for object storage.
          ServerSideEncryption: 'AES256',
        }),
      );
      return key;
    }

    const path = this.pathFor(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, data);
    return key;
  }

  async get(key: string): Promise<Buffer> {
    if (this.s3) {
      const result = await this.s3.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return Buffer.from(await result.Body!.transformToByteArray());
    }
    return readFile(this.pathFor(key));
  }

  async remove(key: string): Promise<void> {
    if (this.s3) {
      await this.s3
        .send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
        .catch(() => undefined);
      return;
    }
    await unlink(this.pathFor(key)).catch(() => undefined);
  }

  /**
   * Keys are opaque ids this service generated, never user input — but the
   * route that reads them takes path segments, so the traversal check stays.
   */
  private pathFor(key: string): string {
    const path = resolve(join(this.root, key));
    if (!path.startsWith(this.root + '/')) throw new Error('Invalid storage key.');
    return path;
  }
}
