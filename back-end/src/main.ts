import 'dotenv/config'; // must precede every import that reads process.env

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { AppModule } from './app.module';
import { logger } from './common/logging/logger';
import { FileLoggerService } from './common/logging/file-logger.service';
import { requestIdMiddleware } from './common/logging/request-id.middleware';
import { morganFormat, morganOptions } from './common/logging/http-logger';
import * as morgan from 'morgan';
import helmet from 'helmet';
import { helmetOptions } from './common/security/helmet.config';
import { corsOptions } from './common/security/cors.config';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

export function createSwaggerDocument(app: Parameters<typeof SwaggerModule.createDocument>[0]) {
  const config = new DocumentBuilder()
    .setTitle('Checkmate Event Management API')
    .setDescription('REST APIs for event requests, vendors, resources, staff allocation, issues, messaging, bookings, and superuser management. Pass the active user role in the x-role header.')
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Paste the token returned by POST /api/auth/login.' }, 'bearer')
    .build();
  return SwaggerModule.createDocument(app, config);
}

export async function bootstrap() {
  // bufferLogs so bootstrap-time logs are replayed into the files once the
  // winston-backed logger is attached below.
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(FileLoggerService));
  app.flushLogs();

  // 1. Request id -- FIRST, before the body parsers. An id set after them is
  //    useless for exactly the malformed-body errors most worth tracing.
  app.use(requestIdMiddleware);

  // 2. Security headers -- every later layer inherits them, including
  //    ServeStatic responses and error responses. Deliberately app.use()d and
  //    not a Nest module: a module registers during init() and would stop
  //    covering static files, which silently breaks avatar delivery.
  app.use(helmet(helmetOptions));

  // 3. Access log -- BEFORE enableCors, because enableCors terminates an allowed
  //    preflight with a 204 that morgan would otherwise never see.
  app.use(morgan(morganFormat, morganOptions));

  // 4. Global route prefix. MiddlewareConsumer.forRoutes() paths are relative to
  //    it, so they are written without /api.
  app.setGlobalPrefix('api');

  // 5. CORS -- an origin allowlist, replacing reflect-anything origin: true.
  app.enableCors(corsOptions);

  // 6. Validation -- runs after the body parsers, which populate req.body.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  // 7. Error handling -- LAST in the stack. It can only report what every
  //    layer before it produced. Nest appends its own terminal Express error
  //    handler during init(), so nothing goes after this.
  app.useGlobalFilters(new AllExceptionsFilter());

  const document = createSwaggerDocument(app);
  // persistAuthorization keeps the pasted token across page reloads in Swagger UI.
  SwaggerModule.setup('api/docs', app, document, { swaggerOptions: { persistAuthorization: true } });
  try {
    const docsDir = join(process.cwd(), 'docs');
    mkdirSync(docsDir, { recursive: true });
    writeFileSync(join(docsDir, 'swagger.json'), JSON.stringify(document, null, 2));
  } catch (err: any) {
    logger.warn({ message: `Failed to write swagger.json: ${err?.message}`, kind: 'warn' });
  }

  // Lets LoggerFlushService drain winston before the process exits.
  app.enableShutdownHooks();

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}

process.on('unhandledRejection', (reason: any) => {
  logger.error({ message: 'unhandledRejection', stack: reason?.stack ?? String(reason), kind: 'error' });
});

process.on('uncaughtException', (err: Error) => {
  logger.error({ message: 'uncaughtException', stack: err.stack, kind: 'error' });
  setTimeout(() => process.exit(1), 100);
});

if (require.main === module) {
  bootstrap().catch((err) => {
    logger.error({ message: 'bootstrap failed', stack: err?.stack, kind: 'error' });
    process.exit(1);
  });
}
