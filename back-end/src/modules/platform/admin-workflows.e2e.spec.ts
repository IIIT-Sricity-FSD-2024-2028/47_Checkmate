import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { AllExceptionsFilter } from '../../common/filters/all-exceptions.filter';
import { DataService } from '../../database/data.service';

// End-to-end checks for the admin workflows and the rules the backend enforces.
// Runs against a temp copy of the seed data (see test/setup-env.js).
describe('admin workflows (e2e)', () => {
  let app: INestApplication;
  let data: DataService;
  let admin: string;
  let superuser: string;
  let client: string;
  let vendor: string;

  const api = () => request(app.getHttpServer());

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    data = moduleRef.get(DataService);
    const jwt = moduleRef.get(JwtService);
    const token = (sub: string) => `Bearer ${jwt.sign({ sub })}`;
    admin = token('U001');
    vendor = token('U002');
    client = token('U004');
    superuser = token('U005');
  });

  afterAll(async () => {
    await app.close();
  });

  // A pending event owned by Emily (U004), far enough ahead that the scheduler leaves it alone.
  const createClientEvent = async (budget = 40000) => {
    const res = await api()
      .post('/api/events')
      .set('Authorization', client)
      .send({ name: `Refund Test ${Date.now()}`, type: 'Corporate', date: '2030-12-01', time: '10:00', venue: 'Hall A', budget, client: 'Emily Carter', clientId: 'U004' })
      .expect(201);
    return res.body;
  };

  describe('refund', () => {
    it('cancels the booking, refunds the client and drops the payout from the totals', async () => {
      const event = await createClientEvent();
      await api().patch(`/api/events/${event.id}/status`).set('Authorization', admin).send({ status: 'approved' }).expect(200);

      const booking = data.collection('bookings').find((b) => b.eventId === event.id)!;
      expect(booking.payoutStatus).toBe('pending');
      await api().patch(`/api/bookings/${booking.id}/pay`).set('Authorization', client).expect(200);

      const before = (await api().get('/api/bookings/commissions').set('Authorization', admin).expect(200)).body.summary;

      const res = await api().patch(`/api/events/${event.id}/refund`).set('Authorization', admin).send({ reason: 'Venue closed' }).expect(200);
      expect(res.body.status).toBe('cancelled');
      expect(res.body.refundReason).toBe('Venue closed');

      const refunded = data.find('bookings', booking.id);
      expect(refunded.status).toBe('Cancelled');
      expect(refunded.payoutStatus).toBe('cancelled');
      expect(refunded.paymentStatus).toBe('refunded');
      expect(refunded.refundedAmount).toBe(40000);

      const after = (await api().get('/api/bookings/commissions').set('Authorization', admin).expect(200)).body.summary;
      expect(after.pendingVendorPayouts).toBeCloseTo(before.pendingVendorPayouts - booking.vendorPayoutAmount!, 2);
      expect(after.totalGrossVolume).toBeCloseTo(before.totalGrossVolume - 40000, 2);

      const note = data.collection('notifications').find((n) => n.userId === 'U004' && n.title.includes('Refunded'));
      expect(note).toBeDefined();
    });

    it('refuses events that are not approved yet', async () => {
      const event = await createClientEvent();
      await api().patch(`/api/events/${event.id}/refund`).set('Authorization', admin).send({}).expect(400);
    });

    it('is admin-only', async () => {
      const event = await createClientEvent();
      await api().patch(`/api/events/${event.id}/refund`).set('Authorization', client).send({}).expect(403);
    });
  });

  it('stops a client from approving their own event through the generic update', async () => {
    const event = await createClientEvent();
    await api().patch(`/api/events/${event.id}`).set('Authorization', client).send({ status: 'approved' }).expect(403);
    await api().patch(`/api/events/${event.id}`).set('Authorization', client).send({ venue: 'Hall B' }).expect(200);
  });

  it('only lets /state write the shared keys', async () => {
    await api().put('/api/state/users').set('Authorization', client).send({ value: [] }).expect(403);
    await api().put('/api/state/platformSettings').set('Authorization', client).send({ value: { commissionRate: 0 } }).expect(403);
    await api().put('/api/state/activityLogs').set('Authorization', admin).send({ value: [] }).expect(403);
    await api().put('/api/state/coordinationMessages').set('Authorization', client).send({ value: [] }).expect(200);
    expect(data.collection('users').length).toBeGreaterThan(0);
  });

  it('validates package decisions', async () => {
    await api().patch('/api/packages/P001/decision').set('Authorization', admin).send({ status: 'banana' }).expect(400);
    await api().patch('/api/packages/P001/decision').set('Authorization', admin).send({ status: 'approved' }).expect(200);
  });

  describe('vendor applications', () => {
    const apply = (email: string) =>
      api()
        .post('/api/vendor-applications')
        .send({ vendorName: 'Test Vendor', businessName: `Biz ${email}`, email, phone: '+1 555-7777', documents: [], passwordHash: 'Demo@2026', status: 'approved' });

    it('hashes the password on arrival, never returns it, and the approved vendor can log in', async () => {
      const res = await apply('newvendor@example.com').expect(201);
      expect(res.body.passwordHash).toBeUndefined();
      expect(res.body.status).toBe('pending');
      expect(data.find('vendorApplications', res.body.id).passwordHash).toMatch(/^[a-f0-9]{64}$/);

      const list = await api().get('/api/vendor-applications').set('Authorization', admin).expect(200);
      expect(list.body.every((a: any) => a.passwordHash === undefined)).toBe(true);

      await api().patch(`/api/vendor-applications/${res.body.id}/decision`).set('Authorization', admin).send({ status: 'approved' }).expect(200);
      await api().post('/api/auth/login').send({ email: 'newvendor@example.com', password: 'Demo@2026' }).expect(201);
    });

    it('auto-approves when Global Settings says so', async () => {
      await api().put('/api/settings').set('Authorization', admin).send({ autoApproveVendors: true }).expect(200);
      const res = await apply('autovendor@example.com').expect(201);
      expect(res.body.status).toBe('approved');
      expect(data.collection('users').some((u) => u.email === 'autovendor@example.com')).toBe(true);
      await api().put('/api/settings').set('Authorization', admin).send({ autoApproveVendors: false }).expect(200);
    });
  });

  describe('user safety rules', () => {
    it('blocks self-disable and handing out the superuser role', async () => {
      await api().patch('/api/users/U001').set('Authorization', admin).send({ status: 'Inactive' }).expect(400);
      await api().patch('/api/users/U008').set('Authorization', admin).send({ role: 'Superuser' }).expect(403);
      await api().patch('/api/users/U005').set('Authorization', admin).send({ name: 'Hacked' }).expect(403);
      await api().patch('/api/users/U008').set('Authorization', admin).send({ email: 'emily.client@example.com' }).expect(400);
      await api().patch('/api/users/U008').set('Authorization', superuser).send({ name: 'David M.' }).expect(200);
    });
  });

  describe('settings', () => {
    it('are admin-only to change and validated', async () => {
      await api().put('/api/settings').set('Authorization', client).send({ commissionRate: 0 }).expect(403);
      await api().put('/api/settings').set('Authorization', admin).send({ commissionRate: 90 }).expect(400);
      const res = await api().get('/api/settings').expect(200);
      expect(res.body.commissionRate).toBe(10);
    });

    it('enforce the minimum event budget', async () => {
      await api().put('/api/settings').set('Authorization', admin).send({ minEventBudget: 50000 }).expect(200);
      await api()
        .post('/api/events')
        .set('Authorization', client)
        .send({ name: 'Too small', type: 'Birthday', date: '2030-12-02', venue: 'Home', budget: 1000 })
        .expect(400);
      await api().put('/api/settings').set('Authorization', admin).send({ minEventBudget: 0 }).expect(200);
    });

    it('maintenance mode pauses changes for everyone except admins', async () => {
      await api().put('/api/settings').set('Authorization', admin).send({ maintenanceMode: true }).expect(200);
      await api().post('/api/issues').set('Authorization', client).send({ title: 'Blocked?', priority: 'Low' }).expect(503);
      await api().get('/api/events').set('Authorization', client).expect(200);
      await api().post('/api/issues').set('Authorization', admin).send({ title: 'Admin note', priority: 'Low' }).expect(201);
      await api().put('/api/settings').set('Authorization', admin).send({ maintenanceMode: false }).expect(200);
      await api().post('/api/issues').set('Authorization', client).send({ title: 'Works again', priority: 'Low' }).expect(201);
    });
  });

  it('shows announcements only to their audience', async () => {
    const res = await api()
      .post('/api/announcements')
      .set('Authorization', admin)
      .send({ title: 'Vendor payouts delayed', message: 'Payouts go out on Monday.', audience: 'vendor' })
      .expect(201);
    const forVendor = await api().get('/api/announcements').set('Authorization', vendor).expect(200);
    const forClient = await api().get('/api/announcements').set('Authorization', client).expect(200);
    expect(forVendor.body.some((a: any) => a.id === res.body.id)).toBe(true);
    expect(forClient.body.some((a: any) => a.id === res.body.id)).toBe(false);

    await api().post('/api/announcements').set('Authorization', client).send({ title: 'Nope', message: 'Nope', audience: 'all' }).expect(403);
    await api().delete(`/api/announcements/${res.body.id}`).set('Authorization', admin).expect(200);
  });

  it('delivers support replies and issue updates to the client', async () => {
    await api()
      .post('/api/support/replies')
      .set('Authorization', admin)
      .send({ recipientEmail: 'emily.client@example.com', text: 'We are on it.' })
      .expect(201);

    const issue = await api()
      .post('/api/issues')
      .set('Authorization', client)
      .send({ title: 'Projector broken', priority: 'High', email: 'emily.client@example.com' })
      .expect(201);
    await api().patch(`/api/issues/${issue.body.id}`).set('Authorization', admin).send({ status: 'investigating' }).expect(200);

    const chat = (data.getValue('adminChatMessages') as any[]).filter((m) => m.recipientEmail === 'emily.client@example.com');
    expect(chat.some((m) => m.text === 'We are on it.' && m.sender === 'Aarav Mehta')).toBe(true);
    expect(chat.some((m) => m.type === 'system' && m.text.includes('Projector broken'))).toBe(true);
  });
});
