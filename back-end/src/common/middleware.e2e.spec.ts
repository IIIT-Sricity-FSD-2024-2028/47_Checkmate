import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import helmet from 'helmet';
import * as morgan from 'morgan';
import { AppModule } from '../app.module';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { requestIdMiddleware } from './logging/request-id.middleware';
import { morganFormat, morganOptions } from './logging/http-logger';
import { helmetOptions } from './security/helmet.config';
import { corsOptions } from './security/cors.config';

describe('middleware stack (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();

    // Same order as bootstrap() in main.ts.
    app.use(requestIdMiddleware);
    app.use(helmet(helmetOptions));
    app.use(morgan(morganFormat, morganOptions));
    app.setGlobalPrefix('api');
    app.enableCors(corsOptions);
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new AllExceptionsFilter());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('sets X-Request-Id and the CSP header on a normal request', async () => {
    const res = await request(app.getHttpServer()).get('/api/snapshot').set('x-role', 'admin').expect(200);

    expect(res.headers['x-request-id']).toMatch(/^[A-Za-z0-9-]{1,64}$/);
    expect(res.headers['content-security-policy']).toContain("default-src 'self'");
    expect(res.headers['content-security-policy']).toContain("script-src-attr 'unsafe-inline'");
    expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('replaces a malformed inbound request id rather than echoing it', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/snapshot')
      .set('x-role', 'admin')
      .set('x-request-id', 'forged id with spaces')
      .expect(200);

    expect(res.headers['x-request-id']).not.toBe('forged id with spaces');
  });

  it('returns 400 with a requestId for malformed JSON', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{bad')
      .expect(400);

    expect(res.body.statusCode).toBe(400);
    expect(res.body.requestId).toBeDefined();
    expect(res.body.path).toBe('/api/auth/login');
    expect(res.body.stack).toBeUndefined();
  });

  it('rate limits the 21st login while leaving an unscoped route at 200', async () => {
    for (let i = 0; i < 20; i++) {
      await request(app.getHttpServer()).post('/api/auth/login').send({ email: 'a@b.c', password: 'x' });
    }

    await request(app.getHttpServer()).post('/api/auth/login').send({ email: 'a@b.c', password: 'x' }).expect(429);
    await request(app.getHttpServer()).get('/api/vendors').set('x-role', 'admin').expect(200);
  });

  it('returns 400, not 500, when the avatar POST carries no file', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/users/profile/avatar')
      .set('x-email', 'aarav.admin@checkmate.com')
      .expect(400);

    expect(res.body.message).toContain('file');
  });
});
