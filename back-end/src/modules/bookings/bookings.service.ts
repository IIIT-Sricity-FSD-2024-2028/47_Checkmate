import { Injectable } from '@nestjs/common';
import { DataService } from '../../database/data.service';
import { CreateBookingDto, UpdateBookingDto } from './dto';

@Injectable()
export class BookingsService {
  constructor(private readonly data: DataService) {}
  findAll() { return this.data.collection('bookings'); }
  findOne(id: string) { return this.data.find('bookings', id); }
  create(dto: CreateBookingDto) { return this.data.create('bookings', 'BK', dto); }
  update(id: string, dto: UpdateBookingDto) { return this.data.update('bookings', id, dto); }
  remove(id: string) { return this.data.remove('bookings', id); }
}
