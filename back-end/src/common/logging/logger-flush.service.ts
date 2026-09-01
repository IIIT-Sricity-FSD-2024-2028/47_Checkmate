import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { logger } from './logger';

// app.enableShutdownHooks() knows nothing about winston. Without this provider a
// burst of records written just before shutdown can be lost entirely.
@Injectable()
export class LoggerFlushService implements OnApplicationShutdown {
  async onApplicationShutdown() {
    await new Promise<void>((resolve) => {
      logger.on('finish', () => resolve());
      logger.end();
    });
  }
}
