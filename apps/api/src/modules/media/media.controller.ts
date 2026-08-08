import { Controller, Get, Param, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { VOICE_LIMITS } from '@peace/shared';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { MediaService, type IncomingFile } from './media.service';

@Controller('media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  /**
   * A-3 — a 60-second spoken or filmed testimony, so that someone who would
   * rather speak than write can literally register their voice. Open to
   * visitors, because A-1 does not require an account.
   */
  @Public()
  @Post('uploads')
  @Throttle({ default: { limit: 5, ttl: 3600_000 } })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: VOICE_LIMITS.mediaMaxBytes, files: 1 } }),
  )
  upload(@UploadedFile() file: IncomingFile | undefined, @CurrentUser() user?: AuthenticatedUser) {
    if (!file) throw new BadRequestException('No file was received.');
    return this.media.ingest(file, user?.id);
  }

  /** Serves only assets moderation has published (A-3). */
  @Public()
  @Get(':year/:id')
  async serve(
    @Param('year') year: string,
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    const { buffer, mimeType } = await this.media.streamPublished(`${year}/${id}`);
    response
      .setHeader('content-type', mimeType)
      .setHeader('cache-control', 'public, max-age=31536000, immutable')
      .send(buffer);
  }
}
