/**
 * Unit tests for date-based resource availability.
 * Pure data only: nothing here reads or writes back-end/data/database.json.
 */
import { BadRequestException } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import {
  AvailabilityData,
  findOverAllocations,
  getAvailability,
  getAvailableQuantity,
  parseMinutes,
  windowsOverlap,
} from './resource-availability';

// One projector line with 5 units, plus a broken item, and a set of events
function buildData(): AvailabilityData {
  return {
    resources: [
      { id: 'R1', name: 'Projectors', total: 5, quantity: 5 },
      { id: 'R2', name: 'Fog Machines', total: 4, quantity: 4, conditionStatus: 'Damaged' },
    ],
    events: [
      { id: 'E_SAME_DAY', status: 'confirmed', date: '2026-04-15' },
      { id: 'E_MORNING', status: 'pending', date: '2026-04-20', time: '09:00', endTime: '13:00' },
      { id: 'E_MULTI', status: 'approved', date: '2026-05-01', endDate: '2026-05-03' },
      { id: 'E_CANCELLED', status: 'cancelled', date: '2026-04-15' },
      { id: 'E_REJECTED', status: 'Rejected', date: '2026-04-15' },
      { id: 'E_RELEASED', status: 'confirmed', date: '2026-04-15' },
    ],
    resourceAllocations: {
      E_SAME_DAY: [{ resourceId: 'R1', quantity: 3, status: 'allocated' }],
      E_MORNING: [{ resourceId: 'R1', quantity: 2 }],
      E_MULTI: [{ resourceId: 'R1', quantity: 4 }],
      E_CANCELLED: [{ resourceId: 'R1', quantity: 5, status: 'allocated' }],
      E_REJECTED: [{ resourceId: 'R1', quantity: 5 }],
      E_RELEASED: [{ resourceId: 'R1', quantity: 5, status: 'released' }],
    },
  };
}

describe('resource availability by event date', () => {
  it('no overlap: stock booked on another date is fully free', () => {
    const data = buildData();
    expect(getAvailableQuantity(data, 'R1', '2026-04-16')).toBe(5);
    expect(getAvailableQuantity(data, 'R1', '2026-04-14')).toBe(5);
  });

  it('same-day overlap: units held that day are subtracted', () => {
    const result = getAvailability(buildData(), 'R1', { date: '2026-04-15' });
    expect(result).toMatchObject({ total: 5, allocated: 3, available: 2 });
  });

  it('partial time overlap counts; back-to-back slots do not', () => {
    const data = buildData();
    // E_MORNING runs 09:00-13:00 on 2026-04-20
    expect(getAvailableQuantity(data, 'R1', { date: '2026-04-20', time: '12:00', endTime: '16:00' })).toBe(3);
    expect(getAvailableQuantity(data, 'R1', { date: '2026-04-20', time: '8:00 AM', endTime: '9:30 AM' })).toBe(3);
    expect(getAvailableQuantity(data, 'R1', { date: '2026-04-20', time: '13:00', endTime: '18:00' })).toBe(5);
    expect(getAvailableQuantity(data, 'R1', { date: '2026-04-20', time: '06:00', endTime: '09:00' })).toBe(5);
  });

  it('multi-day overlap: any shared day counts, both directions', () => {
    const data = buildData();
    // E_MULTI holds 4 units from 2026-05-01 to 2026-05-03
    expect(getAvailableQuantity(data, 'R1', '2026-05-02')).toBe(1);
    expect(getAvailableQuantity(data, 'R1', { date: '2026-04-29', endDate: '2026-05-01' })).toBe(1);
    expect(getAvailableQuantity(data, 'R1', { date: '2026-05-03', endDate: '2026-05-06' })).toBe(1);
    expect(getAvailableQuantity(data, 'R1', { date: '2026-05-04', endDate: '2026-05-06' })).toBe(5);
    // A multi-day request that spans two separately booked days takes both into account
    expect(getAvailability(data, 'R1', { date: '2026-04-15', endDate: '2026-05-02' })?.allocated).toBe(9);
  });

  it('cancelled, rejected and released allocations are ignored', () => {
    const data = buildData();
    // Only E_SAME_DAY (3 units) holds stock on 2026-04-15
    expect(getAvailability(data, 'R1', { date: '2026-04-15' })?.allocated).toBe(3);
    data.events.find((e) => e.id === 'E_SAME_DAY')!.status = 'declined';
    expect(getAvailableQuantity(data, 'R1', '2026-04-15')).toBe(5);
  });

  it('editing the same event: its own allocation does not block it', () => {
    const data = buildData();
    expect(getAvailableQuantity(data, 'R1', '2026-04-15')).toBe(2);
    expect(getAvailableQuantity(data, 'R1', '2026-04-15', 'E_SAME_DAY')).toBe(5);
    expect(findOverAllocations(data, [{ resourceId: 'R1', quantity: 5 }], { date: '2026-04-15' }, 'E_SAME_DAY')).toEqual([]);
  });

  it('quantity exceeded: returns a clear message naming the date', () => {
    const problems = findOverAllocations(buildData(), [{ resourceId: 'R1', quantity: 2 }, { resourceId: 'R1', quantity: 2 }], { date: '2026-04-15' });
    expect(problems).toEqual(['Only 2 of 5 Projectors are free on 2026-04-15 (requested 4).']);
  });

  it('damaged stock and unknown resources have nothing free', () => {
    const data = buildData();
    expect(getAvailableQuantity(data, 'R2', '2026-09-01')).toBe(0);
    expect(getAvailableQuantity(data, 'NOPE', '2026-09-01')).toBe(0);
    expect(findOverAllocations(data, [{ resourceId: 'NOPE', quantity: 1 }], { date: '2026-09-01' })[0]).toMatch(/does not exist/);
  });

  it('parses 12h and 24h times and handles events past midnight', () => {
    expect(parseMinutes('6:30 PM')).toBe(18 * 60 + 30);
    expect(parseMinutes('12:00 AM')).toBe(0);
    expect(parseMinutes('18:30')).toBe(18 * 60 + 30);
    expect(parseMinutes('nonsense')).toBeNull();
    // 22:00 -> 02:00 overlaps the early hours of the next day
    expect(windowsOverlap({ date: '2026-06-01', time: '22:00', endTime: '02:00' }, { date: '2026-06-02', time: '01:00', endTime: '03:00' })).toBe(true);
    expect(windowsOverlap({ date: '2026-06-01', time: '22:00', endTime: '02:00' }, { date: '2026-06-02', time: '02:00', endTime: '03:00' })).toBe(false);
  });
});

// The service is what the controllers call; it reads live data from DataService.
describe('ResourcesService availability checks', () => {
  function buildService(data = buildData()) {
    const fakeDataService: any = {
      collection: (name: string) => (data as any)[name],
      getValue: (name: string) => (data as any)[name],
      find: (name: string, id: string) => {
        const row = (data as any)[name].find((r: any) => r.id === id);
        if (!row) throw new Error('not found');
        return row;
      },
    };
    return new ResourcesService(fakeDataService);
  }

  it('getAvailableQuantity(resourceId, eventDate, excludeEventId)', () => {
    const service = buildService();
    expect(service.getAvailableQuantity('R1', '2026-04-15')).toBe(2);
    expect(service.getAvailableQuantity('R1', '2026-04-15', 'E_SAME_DAY')).toBe(5);
  });

  it('availability report by eventId uses that event window and excludes it', () => {
    const report = buildService().availabilityReport({ eventId: 'E_SAME_DAY' });
    expect(report.find((r) => r.resourceId === 'R1')).toMatchObject({ date: '2026-04-15', available: 5 });
  });

  it('availability report rejects a missing or invalid date', () => {
    expect(() => buildService().availabilityReport({})).toThrow(BadRequestException);
    expect(() => buildService().availabilityReport({ date: '2026-02-30' })).toThrow(BadRequestException);
  });

  it('allocation map: same resource bookable on two different dates', () => {
    const data = buildData();
    data.events.push({ id: 'E_NEW', status: 'pending', date: '2026-04-16' });
    const next = { ...data.resourceAllocations, E_NEW: [{ resourceId: 'R1', quantity: 5 }] };
    expect(() => buildService(data).assertAllocationMapValid(next)).not.toThrow();
  });

  it('allocation map: over-allocation on the same date is a 400 with a helpful message', () => {
    const data = buildData();
    data.events.push({ id: 'E_NEW', status: 'pending', date: '2026-04-15' });
    const next = { ...data.resourceAllocations, E_NEW: [{ resourceId: 'R1', quantity: 3 }] };
    expect(() => buildService(data).assertAllocationMapValid(next)).toThrow('E_NEW: Only 2 of 5 Projectors are free on 2026-04-15 (requested 3).');
  });

  it('allocation map: unchanged lists are not re-checked, bad shapes are rejected', () => {
    const data = buildData();
    // Legacy over-booking already saved must not block an unrelated save
    data.resourceAllocations.E_SAME_DAY = [{ resourceId: 'R1', quantity: 9 }];
    expect(() => buildService(data).assertAllocationMapValid({ ...data.resourceAllocations })).not.toThrow();
    expect(() => buildService(data).assertAllocationMapValid([])).toThrow(BadRequestException);
    expect(() => buildService(data).assertAllocationMapValid({ E_SAME_DAY: [{ resourceId: 'R1', quantity: -1 }] })).toThrow(BadRequestException);
    expect(() => buildService(data).assertAllocationMapValid({ GHOST: [{ resourceId: 'R1', quantity: 1 }] })).toThrow('unknown event GHOST');
  });

  it('moving an event onto a busy date is refused; re-saving in place is fine', () => {
    const data = buildData();
    const service = buildService(data);
    const multi = data.events.find((e) => e.id === 'E_MULTI')!;
    expect(() => service.assertEventStillFits({ ...multi })).not.toThrow();
    // 4 units on 2026-04-15 where only 2 are free
    expect(() => service.assertEventStillFits({ ...multi, date: '2026-04-15', endDate: undefined })).toThrow(/Only 2 of 5 Projectors/);
  });
});
