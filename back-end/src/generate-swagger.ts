import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { AppModule } from './app.module';
import { createSwaggerDocument } from './main';

async function run() {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  const document = createSwaggerDocument(app);
  const docsDir = join(process.cwd(), 'docs');
  mkdirSync(docsDir, { recursive: true });
  writeFileSync(join(docsDir, 'swagger.json'), JSON.stringify(document, null, 2));
  await app.close();
}

run();
