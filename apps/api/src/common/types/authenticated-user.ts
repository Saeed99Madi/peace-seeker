import type { AccountStatus, UserRole } from '@peace/shared';

export interface AuthenticatedUser {
  id: string;
  displayName: string;
  roles: UserRole[];
  status: AccountStatus;
  locale: string;
  sessionId: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      /** Set by RequestContextMiddleware; correlates logs without storing an IP. */
      requestId?: string;
      /** S-7: a peppered hash, never the address itself. */
      ipHash?: string;
      /** A-5/§3.1: per-session seed for randomised ordering. */
      displaySeed?: string;
    }
  }
}
