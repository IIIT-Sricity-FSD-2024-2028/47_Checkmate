import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { VendorsController } from './vendors.controller';
import { VendorsService } from './vendors.service';

@Module({ imports: [DatabaseModule], controllers: [VendorsController], providers: [VendorsService] })
export class VendorsModule {}
