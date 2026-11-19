/**
 * Unit tests for staff profiles and vendor ratings:
 *   - events completed / "New" badge / average rating
 *   - "busy" is date-based (work on another day does not block)
 *   - ratings: vendor only, completed events only, staff who worked it, once
 * Uses an in-memory fake DataService, so database.json is never touched.
 */
import 'reflect-metadata';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { buildPublicProfile, busyEventFor } from './staff-profile';

function fakeData() {
  const db: Record<string, any> = {
    vendors: [{ id: 'V001', name: 'Elite', userId: 'U002' }, { id: 'V003', name: 'Dream', userId: 'U009' }],
    staff: [
      { id: 'S001', name: 'Mike', role: 'Coordinator', vendorId: 'V001', phone: '1', email: 'm@x.com', experienceYears: 6, skills: ['Planning'] },
      { id: 'S006', name: 'Liam', role: 'Logistics', vendorId: 'V003', phone: '2', email: 'l@x.com' },
    ],
    events: [
      { id: 'E1', name: 'Done Gala', status: 'completed', date: '2027-01-10', time: '10:00', endTime: '14:00', vendorId: 'V001' },
      { id: 'E2', name: 'Future Show', status: 'confirmed', date: '2027-03-10', time: '18:00', endTime: '22:00', vendorId: 'V001' },
      { id: 'E3', name: 'Declined Party', status: 'completed', date: '2027-01-12', vendorId: 'V001' },
    ],
    staffAssignments: [
      { id: 'A1', staffId: 'S001', eventId: 'E1', status: 'completed' },
      { id: 'A2', staffId: 'S001', eventId: 'E2', status: 'accepted' },
      { id: 'A3', staffId: 'S001', eventId: 'E3', status: 'declined' },
    ],
    staffRatings: [],
  };
  const find = (name: string, id: string) => {
    const row = db[name].find((r: any) => r.id === id);
    if (!row) throw new NotFoundException(`${name} ${id}`);
    return row;
  };
  return {
    db, find,
    collection: (name: string) => db[name],
    create: (name: string, _p: string, payload: any) => { const row = { id: `R${db[name].length + 1}`, ...payload }; db[name].push(row); return row; },
    update: (name: string, id: string, patch: any) => Object.assign(find(name, id), patch),
  } as any;
}

const sarah = { id: 'U002', name: 'Sarah', role: 'vendor' };
const otherVendor = { id: 'U009', name: 'Dream owner', role: 'vendor' };

describe('staff profile', () => {
  it('counts only completed events actually worked (declined ignored)', () => {
    const data = fakeData().db;
    const profile = buildPublicProfile(data.staff[0], data);
    expect(profile).toMatchObject({ eventsCompleted: 1, isNew: false, experienceYears: 6, skills: ['Planning'] });
    expect(profile).not.toHaveProperty('phone');
    expect(profile).not.toHaveProperty('email');
  });
  it('someone with no completed events is New and has no rating', () => {
    const data = fakeData().db;
    data.staffRatings.push({ staffId: 'S006', eventId: 'E1', stars: 5 });
    expect(buildPublicProfile(data.staff[1], data)).toMatchObject({ isNew: true, rating: null, ratingCount: 0 });
  });
  it('rating is the average of the vendor ratings', () => {
    const data = fakeData().db;
    data.staffRatings.push({ staffId: 'S001', eventId: 'E1', stars: 5 }, { staffId: 'S001', eventId: 'X', stars: 4 });
    expect(buildPublicProfile(data.staff[0], data)).toMatchObject({ rating: 4.5, ratingCount: 2 });
  });
});

describe('busy is date-based', () => {
  const data = fakeData().db;
  it('busy when the other event overlaps', () => {
    expect(busyEventFor('S001', { date: '2027-03-10', time: '20:00', endTime: '23:00' }, data.staffAssignments, data.events)?.id).toBe('E2');
  });
  it('free on another day, or later the same evening', () => {
    expect(busyEventFor('S001', { date: '2027-03-11', time: '18:00', endTime: '22:00' }, data.staffAssignments, data.events)).toBeNull();
    expect(busyEventFor('S001', { date: '2027-03-10', time: '22:00', endTime: '23:00' }, data.staffAssignments, data.events)).toBeNull();
  });
});

describe('vendor ratings', () => {
  const service = (data = fakeData()) => ({ data, svc: new StaffService(data, {} as any) });
  it('the vendor who ran a completed event can rate staff who worked it', () => {
    const { data, svc } = service();
    const profile: any = svc.rate('S001', { eventId: 'E1', stars: 4, comment: 'Great' }, sarah);
    expect(data.db.staffRatings).toHaveLength(1);
    expect(profile).toMatchObject({ rating: 4, ratingCount: 1 });
  });
  it('rejects ratings before the event is completed', () => {
    expect(() => service().svc.rate('S001', { eventId: 'E2', stars: 5 }, sarah)).toThrow(BadRequestException);
  });
  it('rejects staff who declined / did not work the event', () => {
    expect(() => service().svc.rate('S001', { eventId: 'E3', stars: 5 }, sarah)).toThrow(BadRequestException);
  });
  it('rating the same staff + event again EDITS it (no duplicate) and the average follows', () => {
    const { data, svc } = service();
    svc.rate('S001', { eventId: 'E1', stars: 2 }, sarah);
    const profile: any = svc.rate('S001', { eventId: 'E1', stars: 5, comment: 'Changed my mind' }, sarah);
    expect(data.db.staffRatings).toHaveLength(1);
    expect(data.db.staffRatings[0]).toMatchObject({ stars: 5, comment: 'Changed my mind', updatedAt: expect.any(String) });
    expect(profile).toMatchObject({ rating: 5, ratingCount: 1 });
  });
  it('PATCH edit changes stars/comment; editing with no rating yet -> 404', () => {
    const { data, svc } = service();
    expect(() => svc.editRating('S001', { eventId: 'E1', stars: 3 }, sarah)).toThrow(NotFoundException);
    svc.rate('S001', { eventId: 'E1', stars: 4 }, sarah);
    svc.editRating('S001', { eventId: 'E1', stars: 1, comment: 'late' }, sarah);
    expect(data.db.staffRatings[0]).toMatchObject({ stars: 1, comment: 'late' });
  });
  it('editing is blocked for another vendor (403)', () => {
    const { svc } = service();
    svc.rate('S001', { eventId: 'E1', stars: 4 }, sarah);
    expect(() => svc.editRating('S001', { eventId: 'E1', stars: 1 }, otherVendor)).toThrow(ForbiddenException);
  });
  it("a vendor cannot rate another vendor's staff member (403)", () => {
    const data = fakeData();
    data.db.staffAssignments.push({ id: 'A9', staffId: 'S006', eventId: 'E1', status: 'completed' });
    expect(() => new StaffService(data, {} as any).rate('S006', { eventId: 'E1', stars: 5 }, sarah)).toThrow(ForbiddenException);
  });
  it('average = mean of all ratings, recalculated after an edit', () => {
    const data = fakeData();
    data.db.events.push({ id: 'E4', name: 'Second Gala', status: 'completed', vendorId: 'V001' });
    data.db.staffAssignments.push({ id: 'A4', staffId: 'S001', eventId: 'E4', status: 'completed' });
    const svc = new StaffService(data, {} as any);
    svc.rate('S001', { eventId: 'E1', stars: 5 }, sarah);
    expect(svc.rate('S001', { eventId: 'E4', stars: 4 }, sarah)).toMatchObject({ rating: 4.5, ratingCount: 2 });
    expect(svc.editRating('S001', { eventId: 'E4', stars: 2 }, sarah)).toMatchObject({ rating: 3.5, ratingCount: 2 });
  });
  it('rejects a vendor rating someone else\'s event', () => {
    expect(() => service().svc.rate('S001', { eventId: 'E1', stars: 5 }, otherVendor)).toThrow(ForbiddenException);
  });
  it('only the vendor role is allowed to rate or edit (others get 403 from RolesGuard)', () => {
    expect(Reflect.getMetadata(ROLES_KEY, StaffController.prototype.rate)).toEqual(['vendor']);
    expect(Reflect.getMetadata(ROLES_KEY, StaffController.prototype.editRating)).toEqual(['vendor']);
  });
});
