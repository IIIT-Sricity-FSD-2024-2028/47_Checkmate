import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { PackagesController } from './packages.controller';
import { PackagesService } from './packages.service';

@Module({ imports: [DatabaseModule], controllers: [PackagesController], providers: [PackagesService] })
export class PackagesModule {}
