/**
 * Unit tests for reject / cancel / decline reasons:
 *   - a client cancel needs a reason; reason + who cancelled are saved; vendor notified
 *   - a staff decline needs a reason, only on their own assignment; vendor notified
 *   - an admin/superuser cancel saves who did it and tells client + vendor
 * In-memory fake DataService, so database.json is never touched.
 */
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventsService } from './events/events.service';
import { StaffService } from './staff/staff.service';

function fakeData() {
  const db: Record<string, any> = {
    vendors: [{ id: 'V001', name: 'Elite', userId: 'U002' }],
    events: [
      { id: 'E1', name: 'Pending Party', status: 'pending', date: '2031-01-01', clientId: 'U004', vendorId: 'V001' },
      { id: 'E2', name: 'Confirmed Gala', status: 'confirmed', date: '2031-02-01', clientId: 'U004', vendorId: 'V001' },
    ],
    staff: [{ id: 'S1', name: 'Mike', userId: 'U003', email: 'mike@x.com' }, { id: 'S2', name: 'Other', email: 'o@x.com' }],
    staffAssignments: [
      { id: 'A1', staffId: 'S1', staffName: 'Mike', eventId: 'E2', eventName: 'Confirmed Gala', status: 'assigned' },
      { id: 'A2', staffId: 'S2', staffName: 'Other', eventId: 'E2', eventName: 'Confirmed Gala', status: 'assigned' },
    ],
    resources: [], resourceAllocations: {}, notifications: [],
  };
  const find = (name: string, id: string) => {
    const row = db[name].find((r: any) => r.id === id);
    if (!row) throw new NotFoundException(id);
    return row;
  };
  return {
    db, find,
    collection: (name: string) => db[name],
    update: (name: string, id: string, patch: any) => Object.assign(find(name, id), patch),
    create: (name: string, _p: string, payload: any) => { const row = { id: `N${db[name].length}`, ...payload }; db[name].push(row); return row; },
    notifyUser: (userId: string, title: string, message: string) => userId && db.notifications.push({ userId, title, message }),
    vendorUserId: (vendorId: string) => db.vendors.find((v: any) => v.id === vendorId)?.userId,
  } as any;
}

const emily = { id: 'U004', name: 'Emily', role: 'client' };
const mike = { id: 'U003', name: 'Mike', email: 'mike@x.com', role: 'staff' };

describe('client cancel reasons', () => {
  it('needs a reason', () => {
    expect(() => new EventsService(fakeData()).cancel('E1', emily, '  ')).toThrow(BadRequestException);
  });
  it('saves reason + who cancelled and notifies the vendor', () => {
    const data = fakeData();
    new EventsService(data).cancel('E1', emily, 'Budget issue');
    expect(data.db.events[0]).toMatchObject({ status: 'cancelled', cancellationReason: 'Budget issue', cancelledBy: { id: 'U004', role: 'client' } });
    expect(data.db.notifications).toEqual([expect.objectContaining({ userId: 'U002', message: expect.stringContaining('Budget issue') })]);
  });
});

describe('admin / superuser cancel', () => {
  it('saves who cancelled and tells both client and vendor', () => {
    const data = fakeData();
    new EventsService(data).updateStatus('E2', { status: 'cancelled', note: 'Schedule conflict' }, { id: 'U005', name: 'Nina', role: 'superuser' });
    expect(data.db.events[1]).toMatchObject({ cancellationReason: 'Schedule conflict', cancelledBy: { id: 'U005', role: 'superuser' } });
    const to = data.db.notifications.map((n: any) => n.userId).sort();
    expect(to).toEqual(['U002', 'U004']);
  });
});

describe('staff decline reasons', () => {
  const service = (data = fakeData()) => ({ data, svc: new StaffService(data, {} as any) });
  it('needs a reason', () => {
    expect(() => service().svc.updateAssignment('A1', { status: 'rejected' }, mike)).toThrow(BadRequestException);
  });
  it('only on their own assignment', () => {
    expect(() => service().svc.updateAssignment('A2', { status: 'rejected', declineReason: 'x' }, mike)).toThrow(ForbiddenException);
  });
  it('staff cannot reassign or complete an assignment', () => {
    expect(() => service().svc.updateAssignment('A1', { staffId: 'S2' } as any, mike)).toThrow(ForbiddenException);
    expect(() => service().svc.updateAssignment('A1', { status: 'completed' }, mike)).toThrow(ForbiddenException);
  });
  it('saves the reason and notifies the vendor', () => {
    const { data, svc } = service();
    svc.updateAssignment('A1', { status: 'rejected', declineReason: 'Personal reason' }, mike);
    expect(data.db.staffAssignments[0]).toMatchObject({ status: 'rejected', declineReason: 'Personal reason', declinedBy: { id: 'U003' } });
    expect(data.db.notifications[0]).toMatchObject({ userId: 'U002', message: expect.stringContaining('Personal reason') });
  });
});
