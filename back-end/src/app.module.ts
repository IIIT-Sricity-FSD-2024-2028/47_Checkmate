import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AuthModule } from './modules/auth/auth.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { DatabaseModule } from './database/database.module';
import { EventsModule } from './modules/events/events.module';
import { IssuesModule } from './modules/issues/issues.module';
import { MessagesModule } from './modules/messages/messages.module';
import { PackagesModule } from './modules/packages/packages.module';
import { ResourcesModule } from './modules/resources/resources.module';
import { RolesGuard } from './common/guards/roles.guard';
import { StaffModule } from './modules/staff/staff.module';
import { UsersModule } from './modules/users/users.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { FileLoggerService } from './common/logging/file-logger.service';
import { LoggerFlushService } from './common/logging/logger-flush.service';
import { PUBLIC_ROOT } from './common/paths';
import { loginLimiter, signupLimiter } from './common/security/rate-limit';
import { UploadGuardMiddleware } from './common/middleware/upload-guard.middleware';
import { MutationAuditMiddleware } from './common/middleware/mutation-audit.middleware';
import { UsersController } from './modules/users/users.controller';
import { VendorsController } from './modules/vendors/vendors.controller';

@Module({
  imports: [
    // Scoped handler FIRST. The catch-all below matches every path and ends the
    // request with its own 404, so anything registered after it is unreachable.
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'front-end'),
      serveRoot: '/front-end',
    }),
    // Catch-all LAST: serves back-end/public at /, including /uploads.
    ServeStaticModule.forRoot({
      rootPath: PUBLIC_ROOT,
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    EventsModule,
    ResourcesModule,
    StaffModule,
    PackagesModule,
    IssuesModule,
    MessagesModule,
    VendorsModule,
    BookingsModule,
    AnalyticsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: RolesGuard },
    FileLoggerService,
    LoggerFlushService,
  ],
})
export class AppModule implements NestModule {
  // Router-level middleware. Paths carry NO /api prefix -- setGlobalPrefix is
  // applied to forRoutes() automatically, so '/api/auth/login' would bind
  // nothing and fail silently.
  configure(consumer: MiddlewareConsumer) {
    // Per-IP credential-attempt budget, shared by both login endpoints.
    consumer.apply(loginLimiter).forRoutes('auth/login', 'staff/login');

    // Separate bucket: registration abuse has a different profile than login abuse.
    consumer.apply(signupLimiter).forRoutes('auth/register', 'staff/signup');

    // Rejects oversized uploads on declared Content-Length, before Multer writes.
    consumer
      .apply(UploadGuardMiddleware)
      .forRoutes({ path: 'users/profile/avatar', method: RequestMethod.POST });

    // Audit trail for state-changing calls on the two admin-sensitive controllers.
    consumer.apply(MutationAuditMiddleware).forRoutes(UsersController, VendorsController);
  }
}
