import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({ imports: [DatabaseModule], controllers: [BookingsController], providers: [BookingsService] })
export class BookingsModule {}
