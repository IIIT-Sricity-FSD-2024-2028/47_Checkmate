import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
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
  providers: [{ provide: APP_GUARD, useClass: RolesGuard }],
})
export class AppModule {}
