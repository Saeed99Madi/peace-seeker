import { Injectable, NotFoundException, PayloadTooLargeException } from '@nestjs/common';
import { UnsupportedMediaTypeException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { UPLOAD_LIMITS, VOICE_LIMITS } from '@peace/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { MetadataStripperService } from './metadata-stripper.service';
import { StorageService } from './storage.service';

export interface IncomingFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

const IMAGE_TYPES: readonly string[] = UPLOAD_LIMITS.allowedImageTypes;
const MEDIA_TYPES: readonly string[] = UPLOAD_LIMITS.allowedMediaTypes;

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly stripper: MetadataStripperService,
  ) {}

  /**
   * A-3 / S-3 — an upload is stripped of metadata before it is stored, and is
   * held PENDING until moderation clears it (A-3: "all uploads pass through
   * moderation before publication").
   */
  async ingest(file: IncomingFile, uploaderId?: string) {
    const isImage = IMAGE_TYPES.includes(file.mimetype);
    const isMedia = MEDIA_TYPES.includes(file.mimetype);
    if (!isImage && !isMedia) {
      throw new UnsupportedMediaTypeException('That file type is not accepted.');
    }

    const maxBytes = isImage ? UPLOAD_LIMITS.imageMaxBytes : VOICE_LIMITS.mediaMaxBytes;
    if (file.size > maxBytes) {
      throw new PayloadTooLargeException(
        `Files may be up to ${Math.round(maxBytes / 1024 / 1024)} MB.`,
      );
    }

    const cleaned = isImage
      ? await this.stripper.stripImage(file.buffer)
      : await this.stripper.stripMedia(file.buffer, extensionFor(file.mimetype));

    const key = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}`;
    await this.storage.put(key, cleaned, file.mimetype);

    return this.prisma.mediaAsset.create({
      data: {
        kind: isImage ? 'IMAGE' : file.mimetype.startsWith('audio/') ? 'AUDIO' : 'VIDEO',
        storageKey: key,
        mimeType: file.mimetype,
        bytes: cleaned.byteLength,
        metadataStripped: true,
        uploaderId,
        status: 'PENDING',
      },
      select: { id: true, kind: true, status: true },
    });
  }

  async streamPublished(key: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { storageKey: key } });
    if (!asset || asset.status !== 'PUBLISHED') throw new NotFoundException();
    return { buffer: await this.storage.get(key), mimeType: asset.mimeType };
  }
}

function extensionFor(mimeType: string): string {
  const map: Record<string, string> = {
    'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a',
    'audio/webm': 'weba',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
  };
  return map[mimeType] ?? 'bin';
}
