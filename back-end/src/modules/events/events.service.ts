import { Injectable } from '@nestjs/common';
import { DataService } from '../../database/data.service';
import { StatusDto } from '../../common/dto/action.dto';
import { CreateEventDto, UpdateEventDto } from './dto';

@Injectable()
export class EventsService {
  constructor(private readonly data: DataService) {}
  findAll() { return this.data.collection('events'); }
  findOne(id: string) { return this.data.find('events', id); }
  create(dto: CreateEventDto) {
    const { presetPackageId, ...event } = dto;
    return this.data.create('events', 'EVT', {
      status: 'pending',
      createdBy: 'client',
      ...event,
      packageId: event.packageId || presetPackageId,
    });
  }
  update(id: string, dto: UpdateEventDto) { return this.data.update('events', id, dto); }
  updateStatus(id: string, dto: StatusDto) { return this.data.update('events', id, { status: dto.status }); }
  remove(id: string) { return this.data.remove('events', id); }
}
