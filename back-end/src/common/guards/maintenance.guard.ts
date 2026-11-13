import { CanActivate, ExecutionContext, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataService } from '../../database/data.service';
import { PUBLIC_KEY } from '../decorators/public.decorator';

// Maintenance mode (Global Settings). Runs after JwtAuthGuard and RolesGuard, so
// req.user is known. While it is on, everyone can still read, but only admins
// and superusers can change anything. Public routes (login, sign-up) are left alone.
@Injectable()
export class MaintenanceGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly data: DataService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic) return true;

    const settings = this.data.getValue('platformSettings') as { maintenanceMode?: boolean } | undefined;
    if (!settings?.maintenanceMode) return true;

    const req = context.switchToHttp().getRequest<{ method: string; user?: { role?: string } }>();
    if (req.method === 'GET') return true;
    if (req.user?.role === 'admin' || req.user?.role === 'superuser') return true;

    throw new ServiceUnavailableException('EventPro is under maintenance. You can still view pages, but changes are paused until it ends.');
  }
}
