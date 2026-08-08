import type { z } from 'zod';
import type {
  consumeMagicLinkSchema,
  deleteAccountSchema,
  hidePresenceSchema,
  passwordLoginSchema,
  registerSchema,
  requestMagicLinkSchema,
  setPasswordSchema,
} from '@peace/shared';

/**
 * DTOs are inferred from the shared schemas rather than redeclared, so the
 * limits the UI shows and the limits the API enforces cannot drift apart.
 */
export type RegisterDto = z.output<typeof registerSchema>;
export type RequestMagicLinkDto = z.output<typeof requestMagicLinkSchema>;
export type ConsumeMagicLinkDto = z.output<typeof consumeMagicLinkSchema>;
export type PasswordLoginDto = z.output<typeof passwordLoginSchema>;
export type SetPasswordDto = z.output<typeof setPasswordSchema>;
export type HidePresenceDto = z.output<typeof hidePresenceSchema>;
export type DeleteAccountDto = z.output<typeof deleteAccountSchema>;
