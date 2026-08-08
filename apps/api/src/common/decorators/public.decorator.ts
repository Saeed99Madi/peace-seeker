import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'peace:isPublic';

/**
 * Marks a route as reachable without a session.
 *
 * A-1 is the reason this exists: adding a Voice must work with no account, and
 * the counter and the Wall must be readable by anyone, from anywhere.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
