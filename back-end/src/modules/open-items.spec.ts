/**
 * Unit tests for the remaining open items:
 *   - bcrypt passwords (old SHA-256 hashes still work and are upgraded on login)
 *   - notifications: each user reads only their own; whole-list saves cannot
 *     change or delete anyone else's
 *   - staff only see the events they are assigned to
 *   - vendors may only change their own packages / resources / staff
 * In-memory fake DataService, so database.json is never touched.
 */
import { createHash } from 'node:crypto';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { hashPassword, isBcryptHash, needsRehash, verifyPassword } from '../common/security/password';
import { AuthService } from './auth/auth.service';
import { AnalyticsService } from './analytics/analytics.service';
import { EventsService } from './events/events.service';
import { PackagesService } from './packages/packages.service';
import { ResourcesService } from './resources/resources.service';
import { StaffService } from './staff/staff.service';

const legacy = (pw: string) => createHash('sha256').update(`checkmate-event-platform:${pw}`).digest('hex');

function fakeData() {
  const db: Record<string, any> = {
    users: [{ id: 'U004', name: 'Emily', email: 'emily@x.com', role: 'Client', status: 'Active', passwordHash: legacy('Emily@2026') }],
    vendors: [{ id: 'V001', userId: 'U002' }, { id: 'V003', userId: 'U009' }],
    events: [{ id: 'E1', name: 'Mine', clientId: 'U004' }, { id: 'E2', name: 'Not mine', clientId: 'U008' }],
    staff: [
      { id: 'S1', name: 'Mike', userId: 'U003', email: 'mike@x.com', vendorId: 'V001' },
      { id: 'S6', name: 'Liam', email: 'liam@x.com', vendorId: 'V003' },
    ],
    staffAssignments: [{ id: 'A1', staffId: 'S1', eventId: 'E1', status: 'accepted' }],
    packages: [{ id: 'P1', name: 'Mine', vendorId: 'V001', status: 'approved' }, { id: 'P2', name: 'Theirs', vendorId: 'V003', status: 'approved' }],
    resources: [{ id: 'R1', name: 'Mine', vendorId: 'V001', total: 5 }, { id: 'R2', name: 'Theirs', vendorId: 'V003', total: 5 }],
    resourceAllocations: {},
    notifications: [
      { id: 'N1', userId: 'U004', title: 'for Emily', isRead: false },
      { id: 'N2', userId: 'U008', title: 'for David', isRead: false },
    ],
  };
  const find = (n: string, id: string) => {
    const row = db[n].find((r: any) => r.id === id);
    if (!row) throw new NotFoundException(id);
    return row;
  };
  return {
    db, find,
    collection: (n: string) => db[n],
    getValue: (n: string) => db[n],
    setValue: (n: string, v: any) => (db[n] = v),
    update: (n: string, id: string, patch: any) => Object.assign(find(n, id), patch),
    create: (n: string, _p: string, payload: any) => { const row = { id: `NEW${db[n].length}`, ...payload }; db[n].push(row); return row; },
    remove: (n: string, id: string) => { db[n] = db[n].filter((r: any) => r.id !== id); return { id, deleted: true }; },
    logActivity: () => undefined,
  } as any;
}

const emily = { id: 'U004', email: 'emily@x.com', role: 'client' };
const mike = { id: 'U003', email: 'mike@x.com', role: 'staff' };
const sarah = { id: 'U002', role: 'vendor' };

describe('bcrypt passwords', () => {
  it('new hashes are bcrypt with a random salt and verify', () => {
    const a = hashPassword('Secret@123');
    const b = hashPassword('Secret@123');
    expect(isBcryptHash(a)).toBe(true);
    expect(a).not.toBe(b); // per-password salt
    expect(verifyPassword('Secret@123', a)).toBe(true);
    expect(verifyPassword('wrong', a)).toBe(false);
  });
  it('old SHA-256 hashes still verify and are flagged for upgrade', () => {
    expect(verifyPassword('Emily@2026', legacy('Emily@2026'))).toBe(true);
    expect(needsRehash(legacy('Emily@2026'))).toBe(true);
    expect(needsRehash(hashPassword('x'))).toBe(false);
  });
  it('a successful login upgrades the stored hash to bcrypt', () => {
    const data = fakeData();
    new AuthService(data, { sign: () => 'token' } as any).login({ email: 'emily@x.com', password: 'Emily@2026' });
    expect(isBcryptHash(data.db.users[0].passwordHash)).toBe(true);
    expect(verifyPassword('Emily@2026', data.db.users[0].passwordHash)).toBe(true);
  });
});

describe('notifications per user', () => {
  it('a client reads only their own', () => {
    expect(new AnalyticsService(fakeData()).stateKey('notifications', emily)).toEqual([expect.objectContaining({ id: 'N1' })]);
  });
  it('saving the list keeps other users rows untouched and adds new ones', () => {
    const data = fakeData();
    const svc = new AnalyticsService(data);
    // Emily marks hers read, tries to delete David's (absent) and to add one for David
    svc.setStateKey('notifications', [{ id: 'N1', userId: 'U004', title: 'for Emily', isRead: true }, { id: 'N9', userId: 'U002', title: 'new for vendor' }], emily);
    expect(data.db.notifications.find((n: any) => n.id === 'N1').isRead).toBe(true);
    expect(data.db.notifications.find((n: any) => n.id === 'N2')).toMatchObject({ userId: 'U008', isRead: false });
    expect(data.db.notifications.find((n: any) => n.id === 'N9')).toBeDefined();
  });
  it("cannot change another user's existing notification", () => {
    const data = fakeData();
    new AnalyticsService(data).setStateKey('notifications', [{ id: 'N2', userId: 'U008', title: 'hacked', isRead: true }], emily);
    expect(data.db.notifications.find((n: any) => n.id === 'N2')).toMatchObject({ title: 'for David', isRead: false });
  });
});

describe('staff see only assigned events', () => {
  it('list and single event', () => {
    const svc = new EventsService(fakeData());
    expect(svc.findAll(mike).map((e: any) => e.id)).toEqual(['E1']);
    expect(svc.findOne('E1', mike)).toMatchObject({ id: 'E1' });
    expect(() => svc.findOne('E2', mike)).toThrow(ForbiddenException);
    expect(svc.findAll(sarah)).toHaveLength(2); // vendors unchanged
  });
});

describe('vendor ownership', () => {
  it('packages: own ok, other vendor 403, new ones are pending and stamped', () => {
    const data = fakeData();
    const svc = new PackagesService(data);
    svc.update('P1', { name: 'Renamed' } as any, sarah);
    expect(() => svc.update('P2', { name: 'x' } as any, sarah)).toThrow(ForbiddenException);
    expect(() => svc.remove('P2', sarah)).toThrow(ForbiddenException);
    const created: any = svc.create({ name: 'New', vendorId: 'V003', status: 'approved' } as any, sarah);
    expect(created).toMatchObject({ vendorId: 'V001', status: 'pending' });
    svc.update('P1', { status: 'approved' } as any, sarah);
    expect(data.db.packages[0].status).toBe('approved'); // unchanged: vendors cannot set status
  });
  it('resources: other vendor 403; cannot move own resource to another vendor', () => {
    const svc = new ResourcesService(fakeData());
    expect(() => svc.update('R2', { total: 1 } as any, sarah)).toThrow(ForbiddenException);
    expect(() => svc.remove('R2', sarah)).toThrow(ForbiddenException);
    expect(() => svc.update('R1', { vendorId: 'V003' } as any, sarah)).toThrow(ForbiddenException);
    expect(svc.update('R1', { total: 9 } as any, sarah)).toMatchObject({ total: 9 });
  });
  it('staff: a vendor cannot edit or delete another vendor\'s staff; admins can', () => {
    const svc = new StaffService(fakeData(), {} as any);
    expect(() => svc.update('S6', { role: 'x' } as any, sarah)).toThrow(ForbiddenException);
    expect(() => svc.remove('S6', sarah)).toThrow(ForbiddenException);
    expect(svc.update('S6', { role: 'x' } as any, { id: 'U001', role: 'admin' })).toMatchObject({ role: 'x' });
  });
});
