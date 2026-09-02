import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { logger } from '../logging/logger';

// Single funnel for every error: one JSON shape out, one log record to file.
// Deliberately NOT a terminal Express error middleware -- Nest registers its own
// during init(), so anything .use()d afterwards is unreachable. This filter does
// receive pre-router body-parser errors.
// 'PAYLOAD_TOO_LARGE' -> 'Payload Too Large', so a raw non-HttpException gets
// the same `error` wording as a Nest one.
const titleCase = (name: string) =>
  name
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status: number;
    if (exception instanceof HttpException) {
      status = exception.getStatus();
    } else if (typeof exception?.status === 'number') {
      // A raw PayloadTooLargeError from the body parser is NOT an HttpException;
      // it carries .status = 413. Without this branch it is reported as a 500.
      status = exception.status;
    } else if (typeof exception?.statusCode === 'number') {
      status = exception.statusCode;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
    }

    const payload = exception instanceof HttpException ? exception.getResponse() : undefined;
    const message =
      (payload && typeof payload === 'object' ? (payload as any).message : payload) ??
      exception?.message ??
      'Internal server error';
    const error =
      (payload && typeof payload === 'object' ? (payload as any).error : undefined) ??
      (HttpStatus[status] ? titleCase(String(HttpStatus[status])) : undefined) ??
      'Error';

    const body = {
      statusCode: status,
      error,
      message,
      requestId: (req as any).requestId,
      path: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString(),
    };

    // Stacks go to the log file only -- never into the HTTP response.
    const record = {
      ...body,
      role: (req.headers['x-role'] as string) || '-',
      stack: exception?.stack,
      kind: 'error',
    };

    if (status >= 500) {
      logger.error(record);
    } else {
      logger.warn(record);
    }

    res.status(status).json(body);
  }
}
