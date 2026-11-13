import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataService } from '../../database/data.service';
import { AvailabilityQueryDto, CreateResourceDto, UpdateResourceDto } from './dto';
import {
  AvailabilityData,
  AvailabilityResult,
  BookingWindow,
  eventHoldsStock,
  eventWindow,
  findOverAllocations,
  getAvailability,
  getAvailableQuantity,
  isValidDate,
} from './resource-availability';

@Injectable()
export class ResourcesService {
  constructor(private readonly data: DataService) {}
  findAll() { return this.data.collection('resources'); }
  findOne(id: string) { return this.data.find('resources', id); }
  create(dto: CreateResourceDto) { return this.data.create('resources', 'R', { unit: 'day', ...dto }); }
  update(id: string, dto: UpdateResourceDto) { return this.data.update('resources', id, dto); }
  remove(id: string) { return this.data.remove('resources', id); }

  // --------------------------------------------------------------------------
  // DATE-BASED AVAILABILITY (rules live in resource-availability.ts)
  // --------------------------------------------------------------------------

  // The live records the availability rules read. `allocationsOverride` lets a
  // caller check a map that has not been saved yet.
  private availabilityData(allocationsOverride?: AvailabilityData['resourceAllocations']): AvailabilityData {
    return {
      resources: this.data.collection('resources') as any,
      events: this.data.collection('events') as any,
      resourceAllocations: allocationsOverride || ((this.data.getValue('resourceAllocations') as any) ?? {}),
    };
  }

  /** Units of one resource free on a date (or window), ignoring excludeEventId. */
  getAvailableQuantity(resourceId: string, eventDate: string | BookingWindow, excludeEventId?: string): number {
    return getAvailableQuantity(this.availabilityData(), resourceId, eventDate, excludeEventId);
  }

  // Turns the query string into a window. `eventId` alone means "that event's
  // window, not counting that event"; explicit fields override it.
  private windowFromQuery(query: AvailabilityQueryDto): { window: BookingWindow; excludeEventId?: string } {
    let base: BookingWindow | null = null;
    let excludeEventId = query.excludeEventId;

    if (query.eventId) {
      const event = this.data.find('events', query.eventId) as any;
      base = eventWindow(event);
      excludeEventId = excludeEventId || event.id;
    }

    const window: BookingWindow = {
      date: query.date || base?.date || '',
      endDate: query.endDate ?? base?.endDate,
      time: query.time ?? base?.time,
      endTime: query.endTime ?? base?.endTime,
    };

    if (!isValidDate(window.date)) {
      throw new BadRequestException('Provide a valid date (YYYY-MM-DD) or an eventId that has one.');
    }
    if (window.endDate && (!isValidDate(window.endDate) || window.endDate < window.date)) {
      throw new BadRequestException('endDate must be a valid date (YYYY-MM-DD) on or after date.');
    }
    return { window, excludeEventId };
  }

  /** GET /resources/availability: every resource with its free units for the window. */
  availabilityReport(query: AvailabilityQueryDto): AvailabilityResult[] {
    const { window, excludeEventId } = this.windowFromQuery(query);
    const data = this.availabilityData();
    return data.resources.map((r) => getAvailability(data, r.id, window, excludeEventId)!);
  }

  /** GET /resources/:id/availability: one resource. */
  availabilityFor(resourceId: string, query: AvailabilityQueryDto): AvailabilityResult {
    const { window, excludeEventId } = this.windowFromQuery(query);
    const result = getAvailability(this.availabilityData(), resourceId, window, excludeEventId);
    if (!result) throw new NotFoundException(`resources item ${resourceId} was not found.`);
    return result;
  }

  /**
   * Throws a 400 when the requested units do not fit in the event's window.
   * Used when an event is created with requested resources.
   */
  assertRequestFits(items: any[] | undefined, window: BookingWindow, excludeEventId?: string) {
    if (!Array.isArray(items) || items.length === 0) return;
    if (!isValidDate(window.date)) return; // DTO validation reports a bad date separately
    const problems = findOverAllocations(this.availabilityData(), items, window, excludeEventId);
    if (problems.length) throw new BadRequestException(problems.join(' '));
  }

  /**
   * Throws a 400 when an existing event, moved to a new window, would need more
   * units than are free there. `updatedEvent` is the event after the change.
   */
  assertEventStillFits(updatedEvent: any) {
    if (!eventHoldsStock(updatedEvent)) return;
    const allocations = ((this.data.getValue('resourceAllocations') as any) ?? {})[updatedEvent.id] || [];
    if (!allocations.length) return;
    const problems = findOverAllocations(this.availabilityData(), allocations, eventWindow(updatedEvent), updatedEvent.id);
    if (problems.length) {
      throw new BadRequestException(`Cannot move ${updatedEvent.name || updatedEvent.id}: ${problems.join(' ')}`);
    }
  }

  /**
   * Validates a full replacement of the resourceAllocations map (PUT
   * /state/resourceAllocations). Only events whose list changed are checked, so
   * old data never blocks an unrelated save. Other events are read from the NEW
   * map, so two events changed in one request are both counted.
   */
  assertAllocationMapValid(next: unknown) {
    if (!next || typeof next !== 'object' || Array.isArray(next)) {
      throw new BadRequestException('resourceAllocations must be an object keyed by event id.');
    }
    const nextMap = next as Record<string, any>;
    const current = ((this.data.getValue('resourceAllocations') as any) ?? {}) as Record<string, any>;
    const data = this.availabilityData(nextMap);
    const problems: string[] = [];

    Object.entries(nextMap).forEach(([eventId, items]) => {
      if (!Array.isArray(items)) {
        problems.push(`Allocations for ${eventId} must be a list.`);
        return;
      }
      if (JSON.stringify(items) === JSON.stringify(current[eventId])) return; // unchanged

      const badRow = items.find((item: any) => {
        const qty = item?.quantity ?? item?.qty;
        return !item?.resourceId || typeof qty !== 'number' || !Number.isFinite(qty) || qty < 0;
      });
      if (badRow) {
        problems.push(`Every allocation for ${eventId} needs a resourceId and a quantity of 0 or more.`);
        return;
      }

      const event = data.events.find((e) => String(e.id).toLowerCase() === eventId.toLowerCase());
      if (!event) {
        problems.push(`Cannot allocate resources to unknown event ${eventId}.`);
        return;
      }
      if (!eventHoldsStock(event)) return; // a rejected/cancelled event holds nothing

      findOverAllocations(data, items, eventWindow(event), event.id).forEach((p) =>
        problems.push(`${event.id}: ${p}`),
      );
    });

    if (problems.length) throw new BadRequestException(problems.join(' '));
  }
}
