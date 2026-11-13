import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';

@Module({ imports: [DatabaseModule], controllers: [PlatformController], providers: [PlatformService] })
export class PlatformModule {}
