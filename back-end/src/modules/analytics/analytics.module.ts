import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ResourcesModule } from '../resources/resources.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({ imports: [DatabaseModule, ResourcesModule], controllers: [AnalyticsController], providers: [AnalyticsService] })
export class AnalyticsModule {}
