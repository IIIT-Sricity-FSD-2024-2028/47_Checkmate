import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { DataService } from '../../database/data.service';
import { logger } from '../logging/logger';

// forRoutes() cannot express "every non-GET route of this controller", so the
// method filter lives here rather than in the consumer binding.
const READ_ONLY = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class MutationAuditMiddleware implements NestMiddleware {
  constructor(private readonly data: DataService) {}

  use(req: Request, res: Response, next: NextFunction) {
    if (READ_ONLY.has(req.method)) return next();

    const startedAt = Date.now();
    res.on('finish', () => {
      const entry = {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        role: (req.headers['x-role'] as string) || '-',
        email: (req.headers['x-email'] as string) || '-',
        requestId: (req as any).requestId,
        durationMs: Date.now() - startedAt,
      };

      logger.info({ message: 'mutation audit', ...entry, kind: 'app' });
      this.data.logActivity(
        `${entry.method} ${entry.url}`,
        'HTTP',
        entry.requestId,
        entry,
        undefined,
        entry.role,
      );
    });

    next();
  }
}
