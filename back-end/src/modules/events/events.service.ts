import { Injectable } from '@nestjs/common';
import { DataService } from '../../database/data.service';
import { StatusDto } from '../../common/dto/action.dto';
import { CreateEventDto, UpdateEventDto } from './dto';

// Controllers handle HTTP; services hold the business rules. This one owns the
// event lifecycle: pending -> approved/confirmed -> live -> completed.
@Injectable()
export class EventsService {
  constructor(private readonly data: DataService) {}

  findAll() { return this.data.collection('events'); }
  findOne(id: string) { return this.data.find('events', id); }

  create(dto: CreateEventDto) {
    // Pull presetPackageId out of the payload; `...event` is everything else.
    const { presetPackageId, ...event } = dto;
    return this.data.create('events', 'EVT', {
      // These defaults are listed BEFORE ...event on purpose: a value the client
      // actually sent overwrites the default, because later keys win.
      status: 'pending',
      createdBy: 'client',
      submittedAt: new Date().toISOString(),
      ...event,
      // Accept either field name for the package the event was booked from.
      packageId: event.packageId || presetPackageId,
    });
  }

  update(id: string, dto: UpdateEventDto) { return this.data.update('events', id, dto); }

  // Status changes also stamp the matching timestamp, so the timeline shown on
  // the monitoring pages is recorded rather than guessed.
  updateStatus(id: string, dto: StatusDto) {
    const patch: Record<string, unknown> = { status: dto.status };
    const now = new Date().toISOString();
    // Lowercase once: different portals send 'Confirmed' vs 'confirmed'.
    const s = String(dto.status).toLowerCase();

    if (s === 'approved' || s === 'confirmed') {
      // Reaching this state is what makes DataService auto-create a booking,
      // which is what makes revenue appear on the analytics dashboards.
      patch.approvedAt = now;
    } else if (s === 'live') {
      patch.startedAt = now;
    } else if (s === 'completed') {
      // Completing also releases the event's resources and staff (see DataService).
      patch.endedAt = now;
    } else if (s === 'rejected') {
      patch.rejectedAt = now;
      if (dto.note) patch.rejectionReason = dto.note;
    }

    const updated = this.data.update('events', id, patch as any);
    this.notifyClient(updated as any, s, dto.note);
    return updated;
  }

  remove(id: string) { return this.data.remove('events', id); }

  // Client <-> vendor bridge: when the vendor changes an event's status, drop a
  // notification for the client who owns it. The client portal's bell reads
  // these from the `notifications` collection (filtered by userId).
  private notifyClient(event: { id: string; name: string; clientId?: string; vendor?: string }, status: string, note?: string) {
    if (!event?.clientId) return;

    const messages: Record<string, { title: string; message: string; type: 'success' | 'error' | 'info' }> = {
      confirmed: { title: `${event.name} Approved`, message: `${event.vendor || 'The vendor'} approved your request for ${event.name}.`, type: 'success' },
      approved: { title: `${event.name} Approved`, message: `${event.vendor || 'The vendor'} approved your request for ${event.name}.`, type: 'success' },
      rejected: { title: `${event.name} Rejected`, message: note ? `Reason: ${note}` : `${event.name} was declined by the vendor.`, type: 'error' },
      live: { title: `${event.name} is Live`, message: `${event.name} is now in live execution mode.`, type: 'info' },
      completed: { title: `${event.name} Completed`, message: `${event.name} has finished. Thank you for using EventPro!`, type: 'success' },
    };
    const text = messages[status];
    if (!text) return; // e.g. back to "pending" — nothing to tell the client

    this.data.create('notifications', 'NOTIF', {
      userId: event.clientId,
      ...text,
      isRead: false,
      linkUrl: `/client/track/${event.id}`,
      createdAt: new Date().toISOString(),
    });
  }
}
