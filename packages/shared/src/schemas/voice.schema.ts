import { z } from 'zod';
import { COUNTRY_CODES } from '../countries';
import { VOICE_DISPLAY_MODES, DEFAULT_VOICE_DISPLAY_MODE } from '../enums';
import { VOICE_LIMITS } from '../limits';

/**
 * Module A — The Voice. A-1: no account required; a display name is the only
 * mandatory field, and country is optional and coarse (country level only).
 */
export const createVoiceSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(VOICE_LIMITS.displayNameMin)
    .max(VOICE_LIMITS.displayNameMax),
  country: z.enum(COUNTRY_CODES).optional(),
  message: z.string().trim().max(VOICE_LIMITS.messageMax).optional().or(z.literal('')),
  displayMode: z.enum(VOICE_DISPLAY_MODES).default(DEFAULT_VOICE_DISPLAY_MODE),
  locale: z.string().min(2).max(8).optional(),
  mediaUploadId: z.string().uuid().optional(),
  /**
   * A-9 — used once, to send the withdrawal link, and never stored. It is part
   * of this schema rather than read loose from the body so that it cannot reach
   * the mailer unvalidated: an address containing a line break is a mail-header
   * injection.
   */
  email: z.string().trim().email().max(254).optional().or(z.literal('')),
  /** A-8: invisible CAPTCHA token — never a visible puzzle, never required to be counted. */
  captchaToken: z.string().max(4096).optional(),
});

export type CreateVoiceInput = z.input<typeof createVoiceSchema>;
export type CreateVoiceData = z.output<typeof createVoiceSchema>;

export const withdrawVoiceSchema = z.object({
  token: z.string().min(16).max(128),
});

/** Shape returned to the public Wall of Voices. Deliberately minimal. */
export interface PublicVoice {
  id: string;
  attribution: string;
  country: string | null;
  message: string | null;
  mediaUrl: string | null;
  mediaKind: 'audio' | 'video' | null;
  locale: string | null;
  createdAt: string;
}

/** A-4: one global number. There is no grouped variant of this type by design. */
export interface VoiceCount {
  total: number;
  countriesRepresented: number;
  asOf: string;
}
