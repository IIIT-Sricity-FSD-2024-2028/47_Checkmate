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
      submittedAt: new Date().toISOString(),
      ...event,
      packageId: event.packageId || presetPackageId,
    });
  }
  update(id: string, dto: UpdateEventDto) { return this.data.update('events', id, dto); }
  updateStatus(id: string, dto: StatusDto) {
    const patch: Record<string, unknown> = { status: dto.status };
    const now = new Date().toISOString();
    const s = String(dto.status).toLowerCase();

    if (s === 'approved' || s === 'confirmed') {
      patch.approvedAt = now;
    } else if (s === 'live') {
      patch.startedAt = now;
    } else if (s === 'completed') {
      patch.endedAt = now;
    } else if (s === 'rejected') {
      patch.rejectedAt = now;
      if (dto.note) patch.rejectionReason = dto.note;
    }

    return this.data.update('events', id, patch as any);
  }
  remove(id: string) { return this.data.remove('events', id); }
}
