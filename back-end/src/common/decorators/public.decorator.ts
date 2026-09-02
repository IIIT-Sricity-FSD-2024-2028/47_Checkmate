import { SetMetadata } from '@nestjs/common';

export const PUBLIC_KEY = 'public';

// Marks a route as open to everyone (login, register, vendor sign-up). RolesGuard
// checks for this flag first and returns early, skipping the x-role check.
export const Public = () => SetMetadata(PUBLIC_KEY, true);
