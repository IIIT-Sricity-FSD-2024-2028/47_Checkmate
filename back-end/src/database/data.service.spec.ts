/**
 * Integration tests for the PostgreSQL data layer (DataService + Prisma).
 * They run against the TEST database (test/jest.env.js -> checkmate_test),
 * which is emptied and re-seeded before every test, so the app's own database
 * is never touched.
 *
 * Covered: seeding, plain object <-> row round trip, the triggers now running in
 * transactions (event -> booking, finish -> release + cancellation fee, staff
 * workload), rollback when a step fails, database-level rules (unique rating,
 * 1-5 stars) and the import report for broken links.
 */
import { BadRequestException } from '@nestjs/common';
import { DataService } from './data.service';
import { PrismaService } from './prisma.service';
import { seedData } from './seed';

describe('DataService on PostgreSQL', () => {
  const prisma = new PrismaService();
  const service = new DataService(prisma);

  beforeAll(async () => {
    await prisma.$connect();
  });

  // A fresh copy of the seed for every test
  beforeEach(async () => {
    await service.importAppData(structuredClone(seedData));
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('seeds the 5 sign-in accounts and the demo data', async () => {
    const snapshot = await service.snapshot();
    const emails = snapshot.users.map((u) => u.email);
    for (const email of ['aarav.admin@checkmate.com', 'nina.ops@checkmate.com', 'sarah@eliteevents.com', 'emily.client@example.com', 'mike.staff@eliteevents.com']) {
      expect(emails).toContain(email);
    }
    expect(snapshot.events.length).toBeGreaterThan(0);
    expect(snapshot.staffRatings.length).toBeGreaterThan(0);
  });

  it('a record comes back exactly as it was saved (dates, money, extra fields)', async () => {
    const event = await service.create('events', 'EVT', {
      name: 'Round Trip Gala', type: 'Gala', date: '2027-08-30', endDate: '2027-08-31', time: '21:00', endTime: '00:30',
      venue: 'Skyline Ballroom', guests: 120, quotedPrice: 12345.67, clientId: 'U004', vendorResponses: [{ vendorId: 'V001', ok: true }],
    });
    const back: any = await service.find('events', event.id);
    expect(back).toMatchObject({ date: '2027-08-30', endDate: '2027-08-31', quotedPrice: 12345.67, guests: 120, vendorResponses: [{ vendorId: 'V001', ok: true }] });
  });

  it('creating an event starts its progress monitor and writes an audit log', async () => {
    const event = await service.create('events', 'EVT', { name: 'Audit Gala', type: 'Gala', date: '2027-08-30', venue: 'Hall', status: 'pending' });
    const monitors = (await service.getValue('monitorProgress')) as Record<string, any>;
    expect(monitors[event.id]).toEqual({ setup: 0, registration: 0, event: 0, breakdown: 0 });
    const logs = await service.collection('activityLogs');
    expect(logs.some((l) => l.action === 'EVENT_CREATED' && l.entityId === event.id)).toBe(true);
  });

  it('confirming an event creates its booking in the same transaction', async () => {
    const event = await service.create('events', 'EVT', { name: 'Booked Gala', type: 'Gala', date: '2027-09-01', venue: 'Hall', status: 'pending', clientId: 'U004', vendorId: 'V001', quotedPrice: 20000 });
    await service.update('events', event.id, { status: 'confirmed' });
    const booking = (await service.collection('bookings')).find((b) => b.eventId === event.id)!;
    expect(booking).toMatchObject({ cost: 20000, commissionAmount: 2000, vendorPayoutAmount: 18000, status: 'Confirmed', paymentStatus: 'unpaid' });
  });

  it('cancelling releases allocations and keeps only the cancellation fee', async () => {
    await service.setValue('platformSettings', { commissionRate: 10, cancellationFeePercent: 20 });
    const event = await service.create('events', 'EVT', { name: 'Cancel Gala', type: 'Gala', date: '2027-09-02', venue: 'Hall', status: 'pending', clientId: 'U004', vendorId: 'V001', quotedPrice: 10000 });
    const allocations = (await service.getValue('resourceAllocations')) as Record<string, any[]>;
    await service.setValue('resourceAllocations', { ...allocations, [event.id]: [{ resourceId: 'R001', quantity: 2, status: 'allocated' }] });
    await service.update('events', event.id, { status: 'confirmed' });
    await service.update('events', event.id, { status: 'cancelled' });
    const after = ((await service.getValue('resourceAllocations')) as Record<string, any[]>)[event.id];
    expect(after.every((a) => a.status === 'released')).toBe(true);
    const booking = (await service.collection('bookings')).find((b) => b.eventId === event.id)!;
    expect(booking).toMatchObject({ status: 'Cancelled', cost: 2000, originalCost: 10000, commissionAmount: 200, vendorPayoutAmount: 1800 });
  });

  it('staff workload is recalculated from open assignments', async () => {
    const event = await service.create('events', 'EVT', { name: 'Workload Gala', type: 'Gala', date: '2027-09-03', venue: 'Hall', status: 'confirmed' });
    await service.create('staffAssignments', 'A', { staffId: 'S006', staffName: 'Liam Vance', eventId: event.id, eventName: event.name, role: 'Logistics', status: 'accepted' });
    const liam: any = await service.find('staff', 'S006');
    expect(liam).toMatchObject({ workload: 25, status: 'assigned', events: 1 });
  });

  it('a failing step rolls the whole change back (no half-saved rows)', async () => {
    const before = (await service.collection('staffAssignments')).length;
    // The assignment points at an event that does not exist: the foreign key fails
    await expect(service.create('staffAssignments', 'A', { staffId: 'S001', eventId: 'EVT999', status: 'assigned' })).rejects.toThrow(BadRequestException);
    expect((await service.collection('staffAssignments')).length).toBe(before);
  });

  it('the database itself enforces one rating per vendor + staff + event and 1-5 stars', async () => {
    const existing = (await service.collection('staffRatings'))[0];
    await expect(service.create('staffRatings', 'RT', { ...existing, id: undefined })).rejects.toThrow(BadRequestException);
    await expect(
      prisma.staffRating.create({ data: { id: 'RTBAD', staffId: existing.staffId, eventId: existing.eventId, vendorId: 'V002', stars: 7, createdAt: new Date() } }),
    ).rejects.toThrow(/stars_1_to_5/);
  });

  it('the import skips rows that point at missing records and reports them', async () => {
    const broken = structuredClone(seedData) as any;
    broken.staffAssignments.push({ id: 'A999', staffId: 'S001', eventId: 'EVT404', status: 'assigned' });
    const report = await service.importAppData(broken);
    expect(report.skipped).toContain('staffAssignments A999: staff or event missing');
    expect((await service.collection('staffAssignments')).some((a) => a.id === 'A999')).toBe(false);
  });
});
