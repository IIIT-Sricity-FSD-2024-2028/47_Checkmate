/**
 * Unit tests for the access rules added to close the audit findings:
 *   - a user cannot change their own role through the profile update
 *   - reset codes: no master code, no code in the response, lockout after 5 tries
 *   - PUT /state/:key only accepts allowlisted keys for the right roles
 *   - clients can only edit/delete their own events and never set the status
 *   - staff can only update their own staff record (workload only)
 * Uses an in-memory fake DataService, so the real database.json is never touched.
 */
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users/users.service';
import { AuthService } from './auth/auth.service';
import { AnalyticsService } from './analytics/analytics.service';
import { EventsService } from './events/events.service';
import { StaffService } from './staff/staff.service';

// Small in-memory stand-in for DataService (same method names)
function fakeData() {
  const db: Record<string, any> = {
    users: [
      { id: 'U001', name: 'Admin', email: 'admin@x.com', role: 'Admin', status: 'Active', passwordHash: 'h' },
      { id: 'U004', name: 'Emily', email: 'emily@x.com', role: 'Client', status: 'Active', passwordHash: 'h' },
      { id: 'U008', name: 'David', email: 'david@x.com', role: 'Client', status: 'Active', passwordHash: 'h' },
      { id: 'U003', name: 'Mike', email: 'mike@x.com', role: 'Staff', status: 'Active', passwordHash: 'h' },
    ],
    events: [
      { id: 'EVT1', name: 'Emily event', status: 'pending', date: '2031-01-01', clientId: 'U004' },
      { id: 'EVT2', name: 'David event', status: 'pending', date: '2031-01-02', clientId: 'U008' },
    ],
    staff: [
      { id: 'S1', name: 'Mike', email: 'mike@x.com', userId: 'U003', role: 'Coordinator', workload: 20 },
      { id: 'S2', name: 'Other', email: 'other@x.com', role: 'Helper', workload: 0 },
    ],
    resources: [], resourceAllocations: {}, notifications: [], recruitments: [], bookings: [],
  };
  const find = (name: string, id: string) => {
    const row = db[name].find((r: any) => r.id === id);
    if (!row) throw new NotFoundException(`${name} ${id} not found`);
    return row;
  };
  return {
    db,
    collection: (name: string) => db[name],
    find,
    getValue: (name: string) => db[name],
    setValue: (name: string, value: unknown) => (db[name] = value),
    update: (name: string, id: string, patch: any) => Object.assign(find(name, id), patch),
    create: (name: string, _p: string, payload: any) => { const row = { id: `NEW${db[name].length}`, ...payload }; db[name].push(row); return row; },
    remove: (name: string, id: string) => { db[name] = db[name].filter((r: any) => r.id !== id); return { id, deleted: true }; },
    logActivity: () => undefined,
  } as any;
}

const emily = { id: 'U004', email: 'emily@x.com', role: 'client' };
const mike = { id: 'U003', email: 'mike@x.com', role: 'staff' };

describe('profile update', () => {
  it('ignores role/status even if they reach the service', () => {
    const data = fakeData();
    new UsersService(data).updateProfile('emily@x.com', { name: 'Em', role: 'Admin', status: 'Inactive' } as any);
    expect(data.db.users[1]).toMatchObject({ name: 'Em', role: 'Client', status: 'Active' });
  });
  it('refuses an email that belongs to another account', () => {
    expect(() => new UsersService(fakeData()).updateProfile('emily@x.com', { email: 'admin@x.com' })).toThrow(BadRequestException);
  });
});

describe('password reset codes', () => {
  const service = () => new AuthService(fakeData(), {} as any);
  it('does not return the code and does not accept 123456', () => {
    const auth = service();
    const res: any = auth.forgotPassword('emily@x.com');
    expect(res.otp).toBeUndefined();
    const real = (auth as any).otpStore.get('emily@x.com').otp;
    if (real !== '123456') expect(() => auth.resetPassword({ email: 'emily@x.com', otp: '123456', newPassword: 'Secret@123' })).toThrow(BadRequestException);
  });
  it('locks the code after 5 wrong attempts', () => {
    const auth = service();
    auth.forgotPassword('emily@x.com');
    const real = (auth as any).otpStore.get('emily@x.com').otp;
    const wrong = real === '000000' ? '111111' : '000000';
    for (let i = 0; i < 5; i++) expect(() => auth.resetPassword({ email: 'emily@x.com', otp: wrong, newPassword: 'Secret@123' })).toThrow(BadRequestException);
    expect(() => auth.resetPassword({ email: 'emily@x.com', otp: real, newPassword: 'Secret@123' })).toThrow(BadRequestException);
  });
  it('accepts the right code once', () => {
    const auth = service();
    auth.forgotPassword('emily@x.com');
    const real = (auth as any).otpStore.get('emily@x.com').otp;
    expect(auth.resetPassword({ email: 'emily@x.com', otp: real, newPassword: 'Secret@123' })).toMatchObject({ success: true });
  });
});

describe('PUT /state/:key allowlist', () => {
  const analytics = () => new AnalyticsService(fakeData());
  it('blocks core collections for every role', () => {
    expect(() => analytics().setStateKey('bookings', [], { role: 'admin' })).toThrow(ForbiddenException);
    expect(() => analytics().setStateKey('users', [], { role: 'client' })).toThrow(ForbiddenException);
  });
  it('lets each role write only its own keys', () => {
    expect(analytics().setStateKey('notifications', [], { role: 'client' })).toEqual([]);
    expect(() => analytics().setStateKey('platformSettings', {}, { role: 'vendor' })).toThrow(ForbiddenException);
    expect(analytics().setStateKey('recruitments', [], { role: 'admin' })).toEqual([]);
  });
});

describe('client event ownership', () => {
  const events = (data = fakeData()) => ({ data, service: new EventsService(data) });
  it('client cannot edit or delete another client\'s event', () => {
    const { service } = events();
    expect(() => service.update('EVT2', { notes: 'x' }, emily)).toThrow(ForbiddenException);
    expect(() => service.remove('EVT2', emily)).toThrow(ForbiddenException);
  });
  it('client cannot set the status of their own event', () => {
    expect(() => events().service.update('EVT1', { status: 'confirmed' }, emily)).toThrow(ForbiddenException);
  });
  it('client can edit and delete their own event', () => {
    const { data, service } = events();
    service.update('EVT1', { notes: 'hello' }, emily);
    expect(data.db.events[0].notes).toBe('hello');
    service.remove('EVT1', emily);
    expect(data.db.events.find((e: any) => e.id === 'EVT1')).toBeUndefined();
  });
  it('a new client event is always pending and owned by the caller', () => {
    const created: any = events().service.create({ name: 'x', type: 'y', date: '2031-02-02', venue: 'v', status: 'confirmed', clientId: 'U008' } as any, emily);
    expect(created).toMatchObject({ status: 'pending', clientId: 'U004' });
  });
  it('vendors keep full access', () => {
    const { data, service } = events();
    service.update('EVT2', { status: 'waiting' } as any, { id: 'U002', role: 'vendor' });
    expect(data.db.events[1].status).toBe('waiting');
  });
});

describe('staff record updates', () => {
  const staff = (data = fakeData()) => ({ data, service: new StaffService(data, {} as any) });
  it('staff can update their own workload', () => {
    const { data, service } = staff();
    service.update('S1', { workload: 40 }, mike);
    expect(data.db.staff[0].workload).toBe(40);
  });
  it('staff cannot edit another staff record or their own role', () => {
    const { service } = staff();
    expect(() => service.update('S2', { workload: 10 }, mike)).toThrow(ForbiddenException);
    expect(() => service.update('S1', { role: 'Boss' }, mike)).toThrow(ForbiddenException);
  });
});
