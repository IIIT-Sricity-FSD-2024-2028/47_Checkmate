import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { BookingsController, PaymentsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { PaymentsService } from './payments.service';

@Module({ imports: [DatabaseModule], controllers: [BookingsController, PaymentsController], providers: [BookingsService, PaymentsService] })
export class BookingsModule {}
