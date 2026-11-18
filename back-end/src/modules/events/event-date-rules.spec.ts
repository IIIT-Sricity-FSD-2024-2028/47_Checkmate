/**
 * Unit tests for the two date rules (event-date-rules.ts) and that
 * EventsService applies them to clients only.
 */
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { addDays, assertBookingNotice, assertClientCanCancel, daysUntil, todayString } from './event-date-rules';
import { EventsService } from './events.service';

const TODAY = '2027-03-10';

describe('rule 1: book at least 7 days ahead', () => {
  it('counts calendar days', () => {
    expect(daysUntil('2027-03-17', TODAY)).toBe(7);
    expect(daysUntil('2027-03-09', TODAY)).toBe(-1);
    expect(addDays(TODAY, 7)).toBe('2027-03-17');
  });
  it('allows exactly 7 days and later', () => {
    expect(() => assertBookingNotice('2027-03-17', TODAY)).not.toThrow();
    expect(() => assertBookingNotice('2027-06-01', TODAY)).not.toThrow();
  });
  it('rejects 6 days, today and the past with the earliest allowed date', () => {
    for (const date of ['2027-03-16', TODAY, '2027-01-01']) {
      expect(() => assertBookingNotice(date, TODAY)).toThrow(BadRequestException);
    }
    expect(() => assertBookingNotice('2027-03-16', TODAY)).toThrow(/earliest date you can choose is 2027-03-17/);
  });
  it('rejects a missing / invalid date', () => {
    expect(() => assertBookingNotice('not-a-date', TODAY)).toThrow(BadRequestException);
  });
});

describe('rule 2: clients cancel only more than 3 days ahead', () => {
  it('allows 4 days or more', () => {
    expect(() => assertClientCanCancel('2027-03-14', TODAY)).not.toThrow();
  });
  it('blocks 3 days, 1 day, today and past events and says to contact admin', () => {
    for (const date of ['2027-03-13', '2027-03-11', TODAY, '2027-03-01']) {
      expect(() => assertClientCanCancel(date, TODAY)).toThrow(/contact the admin/);
    }
  });
});

describe('EventsService applies the rules to clients only', () => {
  function fakeData() {
    const db: Record<string, any> = {
      events: [
        { id: 'NEAR', name: 'Soon', status: 'pending', date: addDays(todayString(), 2), clientId: 'U004' },
        { id: 'FAR', name: 'Later', status: 'pending', date: addDays(todayString(), 10), clientId: 'U004' },
      ],
      resources: [], resourceAllocations: {}, vendors: [], notifications: [],
    };
    const find = (name: string, id: string) => {
      const row = db[name].find((r: any) => r.id === id);
      if (!row) throw new NotFoundException(id);
      return row;
    };
    return {
      db, find,
      collection: (name: string) => db[name],
      getValue: (name: string) => db[name],
      update: (name: string, id: string, patch: any) => Object.assign(find(name, id), patch),
      create: (name: string, _p: string, payload: any) => { const row = { id: `NEW${db[name].length}`, ...payload }; db[name].push(row); return row; },
      notifyUser: () => undefined,
      vendorUserId: () => undefined,
    } as any;
  }
  const emily = { id: 'U004', name: 'Emily', role: 'client' };
  const body = (date: string) => ({ name: 'x', type: 'y', venue: 'v', date }) as any;

  it('client create 3 days out -> 400; 8 days out -> ok', () => {
    const svc = new EventsService(fakeData());
    expect(() => svc.create(body(addDays(todayString(), 3)), emily)).toThrow(BadRequestException);
    expect(svc.create(body(addDays(todayString(), 8)), emily)).toMatchObject({ status: 'pending' });
  });
  it('a vendor may still create a closer event', () => {
    expect(new EventsService(fakeData()).create(body(addDays(todayString(), 2)), { id: 'U002', role: 'vendor' })).toBeDefined();
  });
  it('client moving their event inside 7 days -> 400', () => {
    expect(() => new EventsService(fakeData()).update('FAR', { date: addDays(todayString(), 3) }, emily)).toThrow(BadRequestException);
  });
  it('client cancel 2 days out -> 400 (contact admin); 10 days out -> ok', () => {
    const svc = new EventsService(fakeData());
    expect(() => svc.cancel('NEAR', emily, 'Personal reason')).toThrow(/contact the admin/);
    expect(svc.cancel('FAR', emily, 'Personal reason')).toMatchObject({ status: 'cancelled' });
  });
});
