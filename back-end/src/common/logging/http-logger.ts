import * as morgan from 'morgan'; // NOT a default import: morgan.default is a string
import type { Request, Response } from 'express';
import { logger } from './logger';

morgan.token('request-id', (req: Request) => (req as any).requestId || '-');
morgan.token('role', (req: Request) => (req.headers['x-role'] as string) || '-');

export const morganFormat =
  ':remote-addr :method :url :status :res[content-length] - :response-time ms rid=:request-id role=:role';

export const morganOptions: morgan.Options<Request, Response> = {
  stream: {
    write: (line: string) => logger.log({ level: 'http', message: line.trim(), kind: 'access' }),
  },
  // Keeps static-asset noise out of the access log but still records static
  // 4xx/5xx, which are the ones worth having.
  skip: (req: Request, res: Response) =>
    res.statusCode < 400 &&
    (req.originalUrl.startsWith('/front-end') || req.originalUrl.startsWith('/uploads')),
};
