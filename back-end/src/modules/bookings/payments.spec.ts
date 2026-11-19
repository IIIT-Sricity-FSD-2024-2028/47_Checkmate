/**
 * Unit tests for the checkout (payments.service.ts, simulated gateway):
 *   unpaid -> processing -> paid / failed, payment records, receipt numbers,
 *   amount validation, no double payment, no paying cancelled/rejected events,
 *   only the owner pays, retry after a failure.
 * In-memory fake DataService, so database.json is never touched.
 */
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PaymentsService } from './payments.service';

function fakeData() {
  const db: Record<string, any> = {
    vendors: [{ id: 'V001', userId: 'U002' }],
    events: [
      { id: 'E1', status: 'confirmed', clientId: 'U004' },
      { id: 'E2', status: 'cancelled', clientId: 'U004' },
    ],
    bookings: [
      { id: 'BK1', eventId: 'E1', eventName: 'Gala', clientId: 'U004', client: 'Emily', vendorId: 'V001', status: 'Confirmed', cost: 25000, advancePaid: 0, paymentStatus: 'unpaid' },
      { id: 'BK2', eventId: 'E2', eventName: 'Gone', clientId: 'U004', vendorId: 'V001', status: 'Cancelled', cost: 2000, advancePaid: 0, paymentStatus: 'unpaid' },
    ],
    payments: [], notifications: [], activityLogs: [],
  };
  const find = (n: string, id: string) => {
    const row = db[n].find((r: any) => r.id === id);
    if (!row) throw new NotFoundException(id);
    return row;
  };
  return {
    db, find,
    collection: (n: string) => db[n],
    create: (n: string, p: string, payload: any) => { const row = { id: `${p}${db[n].length + 1}`, ...payload }; db[n].push(row); return row; },
    update: (n: string, id: string, patch: any) => Object.assign(find(n, id), patch),
    notifyUser: (userId: string, title: string) => db.notifications.push({ userId, title }),
    vendorUserId: (v: string) => (v === 'V001' ? 'U002' : undefined),
    logActivity: () => undefined,
  } as any;
}

const emily = { id: 'U004', name: 'Emily', role: 'client' };
const david = { id: 'U008', name: 'David', role: 'client' };

describe('checkout (simulated gateway)', () => {
  it('unpaid -> processing -> paid, with a payment record, receipt and vendor notice', async () => {
    const data = fakeData();
    const svc = new PaymentsService(data);
    const p: any = (await svc.startCheckout('BK1', { method: 'card', amount: 25000, methodLabel: 'Card •••• 4242' }, emily));
    expect(p).toMatchObject({ status: 'processing', amount: 25000, method: 'card', gateway: 'simulated' });
    expect(data.db.bookings[0].paymentStatus).toBe('processing');
    const done: any = (await svc.confirm(p.id, 'success', emily));
    expect(done).toMatchObject({ status: 'paid', receiptNo: `RCPT-${p.id}`, gatewayRef: expect.stringMatching(/^SIM-/) });
    expect(data.db.bookings[0]).toMatchObject({ paymentStatus: 'paid', advancePaid: 25000 });
    expect(data.db.notifications[0]).toMatchObject({ userId: 'U002' });
  });
  it('a failed payment marks the booking "failed" and the client can retry', async () => {
    const data = fakeData();
    const svc = new PaymentsService(data);
    const p1: any = (await svc.startCheckout('BK1', { method: 'upi', amount: 25000 }, emily));
    expect((await svc.confirm(p1.id, 'failure', emily))).toMatchObject({ status: 'failed', failureReason: expect.any(String) });
    expect(data.db.bookings[0].paymentStatus).toBe('failed');
    const p2: any = (await svc.startCheckout('BK1', { method: 'netbanking', amount: 25000 }, emily));
    expect((await svc.confirm(p2.id, 'success', emily))).toMatchObject({ status: 'paid' });
    expect(data.db.payments).toHaveLength(2); // both attempts are kept
  });
  it('blocks paying twice and paying while a payment is processing', async () => {
    const data = fakeData();
    const svc = new PaymentsService(data);
    const p: any = (await svc.startCheckout('BK1', { method: 'card', amount: 25000 }, emily));
    await expect((async () => (await svc.startCheckout('BK1', { method: 'card', amount: 25000 }, emily)))()).rejects.toThrow(/already being processed/);
    (await svc.confirm(p.id, 'success', emily));
    await expect((async () => (await svc.startCheckout('BK1', { method: 'card', amount: 25000 }, emily)))()).rejects.toThrow(/already paid/);
    await expect((async () => (await svc.confirm(p.id, 'success', emily)))()).rejects.toThrow(BadRequestException);
  });
  it('the amount must equal the balance due', async () => {
    await expect((async () => new PaymentsService(fakeData()).startCheckout('BK1', { method: 'card', amount: 100 }, emily))()).rejects.toThrow(/balance due/);
  });
  it('cannot pay for a cancelled or rejected event', async () => {
    await expect((async () => new PaymentsService(fakeData()).startCheckout('BK2', { method: 'card', amount: 2000 }, emily))()).rejects.toThrow(/cancelled or rejected/);
  });
  it('only the client who owns the booking can pay or confirm', async () => {
    const data = fakeData();
    const svc = new PaymentsService(data);
    await expect((async () => (await svc.startCheckout('BK1', { method: 'card', amount: 25000 }, david)))()).rejects.toThrow(ForbiddenException);
    const p: any = (await svc.startCheckout('BK1', { method: 'card', amount: 25000 }, emily));
    await expect((async () => (await svc.confirm(p.id, 'success', david)))()).rejects.toThrow(ForbiddenException);
  });
  it('an unknown method is refused', async () => {
    await expect((async () => new PaymentsService(fakeData()).startCheckout('BK1', { method: 'cash', amount: 25000 }, emily))()).rejects.toThrow(BadRequestException);
  });
});
