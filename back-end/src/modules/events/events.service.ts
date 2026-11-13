import { Injectable, BadRequestException, ForbiddenException, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DataService } from '../../database/data.service';
import { StatusDto } from '../../common/dto/action.dto';
import { CreateEventDto, UpdateEventDto } from './dto';

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

// Controllers handle HTTP; services hold the business rules. This one owns the
// event lifecycle: pending -> approved/confirmed -> live -> completed.
@Injectable()
export class EventsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventsService.name);
  private scheduleTimer?: NodeJS.Timeout;

  constructor(private readonly data: DataService) {}

  onModuleInit() {
    this.runSchedule();
    this.scheduleTimer = setInterval(() => this.runSchedule(), SCHEDULE_CHECK_MS);
    this.scheduleTimer.unref(); // Must not keep the process alive on its own
  }

  onModuleDestroy() {
    clearInterval(this.scheduleTimer);
  }

  /** When an event starts and ends, in the server's local time. */
  private scheduleOf(event: { date?: string; time?: string; endTime?: string }) {
    const startMinutes = minutesOf(event.time);
    const midnight = new Date(`${event.date}T00:00:00`);
    if (startMinutes === null || Number.isNaN(midnight.getTime())) return null;

    const endMinutes = minutesOf(event.endTime);
    const duration = endMinutes !== null && endMinutes > startMinutes ? endMinutes - startMinutes : DEFAULT_EVENT_MINUTES;
    const start = new Date(midnight.getTime() + startMinutes * 60000);
    return { start, end: new Date(start.getTime() + duration * 60000) };
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

  create(dto: CreateEventDto) {
    // Pull presetPackageId out of the payload; `...event` is everything else.
    const { presetPackageId, ...event } = dto;

    // Global Settings can set a minimum budget. Budgets sent as text ranges are skipped.
    const minBudget = Number((this.data.getValue('platformSettings') as any)?.minEventBudget || 0);
    const hasBudget = event.budget !== undefined && event.budget !== null && event.budget !== '';
    const budget = Number(event.budget);
    if (minBudget > 0 && hasBudget && Number.isFinite(budget) && budget < minBudget) {
      throw new BadRequestException(`The minimum event budget is ₹${minBudget.toLocaleString('en-IN')}.`);
    }

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

  // Clients may edit the details of their own request, but never its status:
  // approving is the vendor's/admin's job (and approving creates a booking).
  update(id: string, dto: UpdateEventDto, user?: { id: string; role: string }) {
    if (user?.role === 'client') {
      const event = this.data.find('events', id);
      if (event.clientId !== user.id) throw new ForbiddenException('You can only edit your own events.');
      if (dto.status !== undefined && dto.status !== event.status) {
        throw new ForbiddenException('Clients cannot change the status of an event.');
      }
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

  // Admin refund: only an approved event that hasn't started can be refunded.
  // Setting it to cancelled makes DataService cancel the booking and give the
  // stock and staff back; this method adds the paper trail and tells the client.
  refund(id: string, reason: string | undefined, user?: { id: string; role?: string }) {
    const event = this.data.find('events', id);
    if (!['approved', 'confirmed'].includes(String(event.status).toLowerCase())) {
      throw new BadRequestException('Only approved events that have not started can be refunded.');
    }

    const updated = this.data.update('events', id, {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      refundReason: reason || '',
    } as any);
    this.data.logActivity('EVENT_REFUNDED', 'EVENT', id, { eventName: event.name, reason: reason || '' }, user?.id, user?.role);
    this.notifyClient(updated as any, 'cancelled', reason);
    return updated;
  }

  remove(id: string) { return this.data.remove('events', id); }

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
      cancelled: { title: `${event.name} Cancelled & Refunded`, message: note ? `Reason: ${note}. Any payment you made will be refunded.` : `${event.name} was cancelled by the platform. Any payment you made will be refunded.`, type: 'error' },
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
