import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { AppModule } from './app.module';
import { createSwaggerDocument } from './main';

async function run() {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  const document = createSwaggerDocument(app);
  writeFileSync(join(process.cwd(), 'docs', 'swagger.json'), JSON.stringify(document, null, 2));
  await app.close();
}

run();
