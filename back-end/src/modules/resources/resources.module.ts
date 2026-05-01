import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';

@Module({ imports: [DatabaseModule], controllers: [ResourcesController], providers: [ResourcesService] })
export class ResourcesModule {}
