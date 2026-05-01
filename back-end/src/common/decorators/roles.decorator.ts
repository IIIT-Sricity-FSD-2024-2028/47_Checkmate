import { SetMetadata } from '@nestjs/common';

export type Role = 'admin' | 'superuser' | 'vendor' | 'client' | 'staff';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
