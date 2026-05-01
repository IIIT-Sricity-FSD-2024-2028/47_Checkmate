import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { AppModule } from './app.module';

export function createSwaggerDocument(app: Parameters<typeof SwaggerModule.createDocument>[0]) {
  const config = new DocumentBuilder()
    .setTitle('Checkmate Event Management API')
    .setDescription('REST APIs for event requests, vendors, resources, staff allocation, issues, messaging, bookings, and superuser management. Pass the active user role in the x-role header.')
    .setVersion('1.0.0')
    .addApiKey({ type: 'apiKey', name: 'x-role', in: 'header', description: 'Role used for RBAC. Supported values: admin, superuser, vendor, client, staff.' }, 'role')
    .build();
  return SwaggerModule.createDocument(app, config);
}

export async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-role'],
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  const document = createSwaggerDocument(app);
  SwaggerModule.setup('api/docs', app, document);
  writeFileSync(join(process.cwd(), 'docs', 'swagger.json'), JSON.stringify(document, null, 2));

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}

if (require.main === module) {
  bootstrap();
}
