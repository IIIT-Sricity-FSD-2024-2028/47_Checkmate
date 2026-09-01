import { Injectable, LoggerService } from '@nestjs/common';
import { logger } from './logger';

@Injectable()
export class FileLoggerService implements LoggerService {
  log(message: any, context?: string) {
    logger.info({ message: String(message), context, kind: 'app' });
  }

  // Nest calls error(message, stack, context) -- the stack is the SECOND
  // POSITIONAL argument, not a meta object. Treating it as meta silently drops
  // every stack trace.
  error(message: any, stack?: string, context?: string) {
    logger.error({ message: String(message), stack, context, kind: 'error' });
  }

  warn(message: any, context?: string) {
    logger.warn({ message: String(message), context, kind: 'app' });
  }

  debug(message: any, context?: string) {
    logger.debug({ message: String(message), context, kind: 'app' });
  }

  verbose(message: any, context?: string) {
    logger.verbose({ message: String(message), context, kind: 'app' });
  }
}
