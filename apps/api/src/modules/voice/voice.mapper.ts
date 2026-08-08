import type { Voice, MediaAsset } from '@prisma/client';
import type { VoiceDisplayMode } from '@peace/shared';
import { attributionFor } from '../../common/utils/attribution.util';

export interface VoiceWithMedia extends Voice {
  media?: MediaAsset | null;
}

/**
 * The public projection of a Voice. Everything the row knows that the public
 * must not — the submitter's user id, the IP hash, the withdrawal token — is
 * dropped here, in one place, rather than being remembered at each call site.
 */
export interface PublicVoiceDto {
  id: string;
  attribution: { kind: string; value: string | null };
  country: string | null;
  message: string | null;
  mediaUrl: string | null;
  mediaKind: 'audio' | 'video' | null;
  locale: string | null;
  createdAt: string;
}

export function toPublicVoice(voice: VoiceWithMedia, mediaBaseUrl: string): PublicVoiceDto {
  const attribution = attributionFor(
    voice.displayName,
    voice.displayMode as VoiceDisplayMode,
    voice.country,
  );

  // Country is present only when the author volunteered it (A-1), and is coarse
  // by construction (S-3), so it passes through as given. When it is absent and
  // the mode is anonymous, the Voice reads simply as "A voice" (A-6).
  return {
    id: voice.id,
    attribution,
    country: voice.country,
    message: voice.message,
    mediaUrl: voice.media ? `${mediaBaseUrl}/${voice.media.storageKey}` : null,
    mediaKind: mediaKindOf(voice.media),
    locale: voice.locale,
    createdAt: voice.createdAt.toISOString(),
  };
}

function mediaKindOf(media: MediaAsset | null | undefined): 'audio' | 'video' | null {
  if (!media) return null;
  if (media.kind === 'AUDIO') return 'audio';
  if (media.kind === 'VIDEO') return 'video';
  return null;
}
