import { SetMetadata } from '@nestjs/common';

// The five user types the app supports. Used everywhere RBAC is checked.
export type Role = 'admin' | 'superuser' | 'vendor' | 'client' | 'staff';

// The key the metadata is filed under; RolesGuard reads it back by this name.
export const ROLES_KEY = 'roles';

// A custom decorator. Writing @Roles('admin','vendor') above a route handler just
// attaches the list ['admin','vendor'] to that handler as metadata -- it does NOT
// block anything by itself. RolesGuard is what reads the list and enforces it.
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
