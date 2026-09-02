import { Injectable, NestMiddleware, PayloadTooLargeException } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { logger } from '../logging/logger';

// Rejects on the DECLARED Content-Length, before Multer opens a write stream --
// so no partial file is ever created. The exception filter cannot do this: by
// the time it sees LIMIT_FILE_SIZE the bytes have already been streamed.
@Injectable()
export class UploadGuardMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const max = Number(process.env.UPLOAD_MAX_BYTES) || 5 * 1024 * 1024;
    const declared = Number(req.headers['content-length'] || 0);

    logger.info({
      message: 'avatar upload attempt',
      rid: (req as any).requestId,
      email: req.headers['x-email'],
      declared,
      kind: 'app',
    });

    if (declared > max) {
      return next(new PayloadTooLargeException(`Upload exceeds ${max} bytes (declared ${declared}).`));
    }
    next();
  }
}
