import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, Role } from '../decorators/roles.decorator';
import { PUBLIC_KEY } from '../decorators/public.decorator';

// Runs after JwtAuthGuard, so by the time this executes the caller is already
// authenticated and req.user holds their real record. This guard only answers
// "is this user's role allowed to call this route?".
@Injectable()
export class RolesGuard implements CanActivate {
  // Reflector is Nest's tool for reading metadata that decorators attached.
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // getAllAndOverride checks the handler first, then the class, and the first
    // match wins -- so a method-level decorator overrides a controller-level one.
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    // No @Roles() decorator means the route is open to any signed-in user.
    if (!roles?.length) return true;

    // The role comes from the verified token, NOT from a request header. This is
    // the whole point: a client can put anything in a header, but it cannot forge
    // a signed token, so it cannot promote itself to admin.
    const req = context.switchToHttp().getRequest<{ user?: { role?: string } }>();
    const role = req.user?.role;
    if (role && roles.includes(String(role).toLowerCase() as Role)) return true;

    throw new ForbiddenException(
      `This account's role (${role ?? 'unknown'}) cannot access this endpoint. Allowed: ${roles.join(', ')}.`,
    );
  }
}
