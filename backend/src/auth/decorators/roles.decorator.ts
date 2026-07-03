import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../db/schema';

export const ROLES_KEY = 'roles';

/** Restricționează o rută la anumite roluri: `@Roles('ADMIN')`. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
