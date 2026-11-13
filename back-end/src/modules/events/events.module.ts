import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ResourcesModule } from '../resources/resources.module';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({ imports: [DatabaseModule, ResourcesModule], controllers: [EventsController], providers: [EventsService] })
export class EventsModule {}
