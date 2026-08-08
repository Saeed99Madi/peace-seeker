import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@peace/shared';

export const ROLES_KEY = 'peace:roles';

/**
 * Restricts a route to holders of at least one of the given roles.
 *
 * §4: roles are additive capabilities, not ranks. A Facilitator is not "above"
 * a Member — this decorator gates access to a *duty*, and no role difference is
 * ever rendered publicly.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
