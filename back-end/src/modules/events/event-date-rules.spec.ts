/**
 * Unit tests for the two date rules (event-date-rules.ts) and that
 * EventsService applies them to clients only.
 */
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { addDays, assertBookingNotice, assertClientCanCancel, daysUntil, todayString } from './event-date-rules';
import { EventsService } from './events.service';

const TODAY = '2027-03-10';

describe('rule 1: book at least 7 days ahead', () => {
  it('counts calendar days', async () => {
    expect(daysUntil('2027-03-17', TODAY)).toBe(7);
    expect(daysUntil('2027-03-09', TODAY)).toBe(-1);
    expect(addDays(TODAY, 7)).toBe('2027-03-17');
  });
  it('allows exactly 7 days and later', async () => {
    await expect((async () => assertBookingNotice('2027-03-17', TODAY))()).resolves.not.toThrow();
    await expect((async () => assertBookingNotice('2027-06-01', TODAY))()).resolves.not.toThrow();
  });
  it('rejects 6 days, today and the past with the earliest allowed date', async () => {
    for (const date of ['2027-03-16', TODAY, '2027-01-01']) {
      await expect((async () => assertBookingNotice(date, TODAY))()).rejects.toThrow(BadRequestException);
    }
    await expect((async () => assertBookingNotice('2027-03-16', TODAY))()).rejects.toThrow(/earliest date you can choose is 2027-03-17/);
  });
  it('rejects a missing / invalid date', async () => {
    await expect((async () => assertBookingNotice('not-a-date', TODAY))()).rejects.toThrow(BadRequestException);
  });
});

describe('rule 2: clients cancel only more than 3 days ahead', () => {
  it('allows 4 days or more', async () => {
    await expect((async () => assertClientCanCancel('2027-03-14', TODAY))()).resolves.not.toThrow();
  });
  it('blocks 3 days, 1 day, today and past events and says to contact admin', async () => {
    for (const date of ['2027-03-13', '2027-03-11', TODAY, '2027-03-01']) {
      await expect((async () => assertClientCanCancel(date, TODAY))()).rejects.toThrow(/contact admin/);
    }
  });
});

describe('EventsService applies the rules to clients only', () => {
  function fakeData() {
    const db: Record<string, any> = {
      events: [
        { id: 'NEAR', name: 'Soon', status: 'pending', date: addDays(todayString(), 2), clientId: 'U004' },
        { id: 'FAR', name: 'Later', status: 'pending', date: addDays(todayString(), 10), clientId: 'U004' },
        { id: 'D3', name: 'Exactly 3', status: 'confirmed', date: addDays(todayString(), 3), clientId: 'U004', vendorId: 'V001' },
        { id: 'D4', name: 'Exactly 4', status: 'confirmed', date: addDays(todayString(), 4), clientId: 'U004', vendorId: 'V001' },
        { id: 'PAST', name: 'Past', status: 'confirmed', date: addDays(todayString(), -2), clientId: 'U004' },
        { id: 'LIVE', name: 'Live', status: 'live', date: addDays(todayString(), 20), clientId: 'U004' },
      ],
      users: [{ id: 'U001', role: 'Admin' }, { id: 'U005', role: 'Superuser' }, { id: 'U004', role: 'Client' }],
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
      notifyUser: (userId: string, title: string) => db.notifications.push({ userId, title }),
      vendorUserId: (v: string) => (v === 'V001' ? 'U002' : undefined),
    } as any;
  }
  const emily = { id: 'U004', name: 'Emily', role: 'client' };
  const body = (date: string) => ({ name: 'x', type: 'y', venue: 'v', date }) as any;

  it('client create 3 days out -> 400; 8 days out -> ok', async () => {
    const svc = new EventsService(fakeData());
    await expect((async () => (await svc.create(body(addDays(todayString(), 3)), emily)))()).rejects.toThrow(BadRequestException);
    expect((await svc.create(body(addDays(todayString(), 8)), emily))).toMatchObject({ status: 'pending' });
  });
  it('a vendor may still create a closer event', async () => {
    expect(await new EventsService(fakeData()).create(body(addDays(todayString(), 2)), { id: 'U002', role: 'vendor' })).toMatchObject({ status: 'pending' });
  });
  it('client moving their event inside 7 days -> 400', async () => {
    await expect((async () => new EventsService(fakeData()).update('FAR', { date: addDays(todayString(), 3) }, emily))()).rejects.toThrow(BadRequestException);
  });
  it('client cancel 2 days out -> 400 (contact admin); 10 days out -> ok', async () => {
    const svc = new EventsService(fakeData());
    await expect((async () => (await svc.cancel('NEAR', emily, 'Personal reason')))()).rejects.toThrow(/contact admin/);
    expect((await svc.cancel('FAR', emily, 'Personal reason'))).toMatchObject({ status: 'cancelled' });
  });
  it('confirmed events: exactly 4 days ok; exactly 3 days, 2 days and past -> 400 with the owner\'s message', async () => {
    const data = fakeData();
    const svc = new EventsService(data);
    for (const id of ['D3', 'NEAR', 'PAST']) {
      await expect((async () => (await svc.cancel(id, emily, 'Budget issue')))()).rejects.toThrow('Cancellation is not allowed within 3 days of the event, contact admin.');
    }
    expect((await svc.cancel('D4', emily, 'Budget issue'))).toMatchObject({ status: 'cancelled', cancelledBy: { role: 'client' } });
  });
  it('a live event can never be cancelled by the client', async () => {
    await expect((async () => new EventsService(fakeData()).cancel('LIVE', emily, 'x'))()).rejects.toThrow(/cannot be cancelled/);
  });
  it('the vendor and every admin/superuser are notified', async () => {
    const data = fakeData();
    (await new EventsService(data).cancel('D4', emily, 'Budget issue'));
    expect(data.db.notifications.map((n: any) => n.userId).sort()).toEqual(['U001', 'U002', 'U005']);
  });
  it('an admin can still cancel inside 3 days (with a reason)', async () => {
    const data = fakeData();
    const updated: any = (await new EventsService(data).updateStatus('D3', { status: 'cancelled', note: 'Venue/resource unavailable' }, { id: 'U001', name: 'Aarav', role: 'admin' }));
    expect(updated).toMatchObject({ status: 'cancelled', cancellationReason: 'Venue/resource unavailable', cancelledBy: { role: 'admin' } });
  });
});
