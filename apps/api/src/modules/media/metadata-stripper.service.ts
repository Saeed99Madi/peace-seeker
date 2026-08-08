import { Injectable, Logger, UnprocessableEntityException } from '@nestjs/common';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';

/**
 * S-3 — strip EXIF/GPS metadata from every uploaded image and video on ingest.
 *
 * This is one of the highest-stakes lines of code in the platform: a single
 * un-stripped photograph can place a member at a precise location at a precise
 * time. The service therefore fails closed — if metadata cannot be removed, the
 * upload is rejected rather than stored.
 */
@Injectable()
export class MetadataStripperService {
  private readonly logger = new Logger(MetadataStripperService.name);

  async stripImage(input: Buffer): Promise<Buffer> {
    try {
      // Re-encoding through sharp without `withMetadata()` drops every EXIF,
      // IPTC, XMP and GPS block, including the thumbnail (which carries its own).
      return await sharp(input).rotate().toBuffer();
    } catch (error) {
      this.logger.error('Image metadata stripping failed', error as Error);
      throw new UnprocessableEntityException('This image could not be processed safely.');
    }
  }

  /** Remuxes audio/video, discarding all container and stream metadata. */
  async stripMedia(input: Buffer, extension: string): Promise<Buffer> {
    const dir = await mkdtemp(join(tmpdir(), 'peace-media-'));
    const source = join(dir, `in.${extension}`);
    const output = join(dir, `out.${extension}`);
    try {
      await writeFile(source, input);
      await this.ffmpeg(['-i', source, '-map_metadata', '-1', '-c', 'copy', '-y', output]);
      return await readFile(output);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }

  private ffmpeg(args: string[]): Promise<void> {
    return new Promise((resolvePromise, reject) => {
      const child = spawn('ffmpeg', args, { stdio: 'ignore' });
      child.on('error', () =>
        reject(
          new UnprocessableEntityException(
            'Media processing is unavailable, so this upload was refused rather than stored with its metadata intact.',
          ),
        ),
      );
      child.on('close', (code) =>
        code === 0
          ? resolvePromise()
          : reject(new UnprocessableEntityException('This recording could not be processed safely.')),
      );
    });
  }
}
