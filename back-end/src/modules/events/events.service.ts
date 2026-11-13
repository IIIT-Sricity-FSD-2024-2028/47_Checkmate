import { Injectable, BadRequestException, ForbiddenException, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DataService } from '../../database/data.service';
import { StatusDto } from '../../common/dto/action.dto';
import { CreateEventDto, UpdateEventDto } from './dto';
import { ResourcesService } from '../resources/resources.service';

const SCHEDULE_CHECK_MS = 30 * 1000;
const DEFAULT_EVENT_MINUTES = 4 * 60; // Older events have no end time

// "6:30 PM" or "18:30" -> minutes after midnight; null if unreadable
function minutesOf(time?: string): number | null {
  const match = String(time || '').trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (!match) return null;
  let hours = Number(match[1]);
  if (match[3] === 'pm' && hours < 12) hours += 12;
  if (match[3] === 'am' && hours === 12) hours = 0;
  return hours * 60 + Number(match[2] || 0);
}

// Fields only the vendor/admin side may set. A client changing these could
// approve their own request (status) or take over someone else's event.
const CLIENT_LOCKED_FIELDS = [
  'status', 'client', 'clientId', 'clientEmail', 'vendor', 'vendorId', 'vendorEmail', 'vendorIds', 'vendors',
  'vendorResponses', 'conflicts', 'createdBy', 'submittedAt', 'approvedAt', 'startedAt', 'endedAt', 'rejectedAt', 'rejectionReason',
];

// Who is calling (req.user from the verified token)
type Caller = { id?: string; role?: string; name?: string; email?: string } | undefined;
const isClient = (user: Caller) => String(user?.role || '').toLowerCase() === 'client';

// Controllers handle HTTP; services hold the business rules. This one owns the
// event lifecycle: pending -> approved/confirmed -> live -> completed.
@Injectable()
export class EventsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventsService.name);
  private scheduleTimer?: NodeJS.Timeout;

  // Nest injects ResourcesService. Scripts that build this service by hand with
  // only a DataService (e.g. the root test-*.js files) get one made from it.
  private readonly resources: ResourcesService;

  constructor(private readonly data: DataService, resources?: ResourcesService) {
    this.resources = resources ?? new ResourcesService(data);
  }

  onModuleInit() {
    this.runSchedule();
    this.scheduleTimer = setInterval(() => this.runSchedule(), SCHEDULE_CHECK_MS);
    this.scheduleTimer.unref(); // Must not keep the process alive on its own
  }

  onModuleDestroy() {
    clearInterval(this.scheduleTimer);
  }

  /** When an event starts and ends, in the server's local time. */
  // The end may be on a later day: `endDate` (e.g. 9 PM on the 10th to 12 AM on
  // the 11th), or an end time earlier than the start on a one-day event, which
  // also means it runs past midnight. No end time at all -> DEFAULT_EVENT_MINUTES.
  private scheduleOf(event: { date?: string; endDate?: string; time?: string; endTime?: string }) {
    const startMinutes = minutesOf(event.time);
    const midnight = new Date(`${event.date}T00:00:00`);
    if (startMinutes === null || Number.isNaN(midnight.getTime())) return null;
    const start = new Date(midnight.getTime() + startMinutes * 60000);

    const endMinutes = minutesOf(event.endTime);
    if (endMinutes === null) return { start, end: new Date(start.getTime() + DEFAULT_EVENT_MINUTES * 60000) };

    const lastDay = new Date(`${event.endDate && event.endDate > String(event.date) ? event.endDate : event.date}T00:00:00`);
    let end = new Date((Number.isNaN(lastDay.getTime()) ? midnight : lastDay).getTime() + endMinutes * 60000);
    if (end <= start) end = new Date(end.getTime() + 24 * 60 * 60000); // past midnight
    return { start, end };
  }

  // Approved events go live at their start time and finish at their end time.
  // Going through updateStatus means the usual notifications and stock release run.
  runSchedule(now = new Date()) {
    this.data.collection('events').forEach((event) => {
      const status = String(event.status).toLowerCase();
      if (!['confirmed', 'approved', 'live'].includes(status)) return;
      const schedule = this.scheduleOf(event);
      if (!schedule) return;

      try {
        if (now >= schedule.end) this.updateStatus(event.id, { status: 'completed' });
        else if (status !== 'live' && now >= schedule.start) this.updateStatus(event.id, { status: 'live' });
      } catch (err: any) {
        this.logger.error(`Could not update ${event.id} on schedule: ${err.message}`);
      }
    });
  }

  findAll() { return this.data.collection('events'); }
  findOne(id: string) { return this.data.find('events', id); }

  create(dto: CreateEventDto, user?: Caller) {
    // Pull presetPackageId out of the payload; `...event` is everything else.
    const { presetPackageId, ...event } = dto;
    // A client always creates a PENDING request that belongs to themselves,
    // whatever status / clientId the request body claims.
    if (isClient(user)) {
      event.status = 'pending';
      event.clientId = user!.id;
      event.clientEmail = user!.email || event.clientEmail;
    }
    this.assertEndDateValid(event);
    // A request for more units than are free on that date can never be met,
    // so it is turned away now with a clear message (400) instead of later.
    this.resources.assertRequestFits(event.requestedResources, {
      date: event.date,
      endDate: event.endDate,
      time: event.time,
      endTime: event.endTime,
    });
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

  // Moving an event to another date/time must not double-book the stock it
  // already holds, so the move is checked first. Its own allocations are
  // ignored, which is why re-saving an event never blocks itself.
  update(id: string, dto: UpdateEventDto, user?: Caller) {
    // Clients may only edit their own events, and only the request details
    // (date, time, venue, guests, notes, requested items) -- never the status.
    if (isClient(user)) {
      this.assertClientOwns(id, user);
      const locked = CLIENT_LOCKED_FIELDS.filter((field) => (dto as any)[field] !== undefined);
      if (locked.length) {
        throw new ForbiddenException(`Clients cannot change: ${locked.join(', ')}.`);
      }
    }
    const scheduleFields = ['date', 'endDate', 'time', 'endTime'] as const;
    if (scheduleFields.some((field) => dto[field] !== undefined)) {
      const current = this.data.find('events', id);
      this.assertEndDateValid({ ...current, ...dto });
      this.resources.assertEventStillFits({ ...current, ...dto });
    }
    return this.data.update('events', id, dto);
  }

  // A client can withdraw their own request until the vendor approves it.
  cancel(id: string, user?: { id: string }) {
    const event = this.data.find('events', id);
    if (!event.clientId || event.clientId !== user?.id) throw new ForbiddenException('You can only cancel your own events.');
    if (!['pending', 'waiting'].includes(String(event.status).toLowerCase())) {
      throw new BadRequestException('Only events awaiting approval can be cancelled.');
    }
    return this.data.update('events', id, { status: 'cancelled' } as any);
  }

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
      if (dto.quotedPrice !== undefined) patch.quotedPrice = dto.quotedPrice;
    } else if (s === 'live') {
      patch.startedAt = now;
    } else if (s === 'completed') {
      // Completing also releases the event's resources and staff (see DataService).
      patch.endedAt = now;
    } else if (s === 'rejected') {
      patch.rejectedAt = now;
      if (dto.note) patch.rejectionReason = dto.note;
    } else if (s === 'waiting') {
      patch.reviewedAt = now;
      if (dto.note) patch.waitingReason = dto.note;
    }

    const updated = this.data.update('events', id, patch as any);
    this.notifyClient(updated as any, s, dto.note);
    return updated;
  }

  // Clients may only delete their own events; vendors/admins keep full access.
  remove(id: string, user?: Caller) {
    if (isClient(user)) this.assertClientOwns(id, user);
    return this.data.remove('events', id);
  }

  // An end date ("" = same day) must be a real YYYY-MM-DD on or after the start date
  private assertEndDateValid(event: { date?: string; endDate?: string }) {
    if (!event.endDate) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(event.endDate) || event.endDate < String(event.date)) {
      throw new BadRequestException('End date must be a date on or after the event date.');
    }
  }

  // 403 unless the event's clientId is the signed-in client
  private assertClientOwns(id: string, user: Caller) {
    const event = this.data.find('events', id);
    if (!event.clientId || event.clientId !== user?.id) {
      throw new ForbiddenException('You can only change your own events.');
    }
  }

  // Client <-> vendor bridge: when the vendor changes an event's status, drop a
  // notification for the client who owns it. The client portal's bell reads
  // these from the `notifications` collection (filtered by userId).
  private notifyClient(event: { id: string; name: string; clientId?: string; vendor?: string; quotedPrice?: number }, status: string, note?: string) {
    if (!event?.clientId) return;

    const price = event.quotedPrice ? ` at ₹${Number(event.quotedPrice).toLocaleString('en-IN')}` : '';
    const messages: Record<string, { title: string; message: string; type: 'success' | 'error' | 'info' }> = {
      confirmed: { title: `${event.name} Approved`, message: `${event.vendor || 'The vendor'} approved your request for ${event.name}${price}.`, type: 'success' },
      approved: { title: `${event.name} Approved`, message: `${event.vendor || 'The vendor'} approved your request for ${event.name}${price}.`, type: 'success' },
      waiting: { title: `${event.name} Placed on Hold`, message: note ? `Reason: ${note}` : `${event.name} was reviewed by the vendor and placed on hold pending preparations.`, type: 'info' },
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
