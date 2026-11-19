/**
 * Unit tests for client feedback about the vendor (VendorsService):
 *   rate, edit (no duplicates), wrong owner, wrong role, before completion,
 *   average recalculation and the vendor notification.
 * In-memory fake DataService, so database.json is never touched.
 */
import 'reflect-metadata';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { VendorsController } from './vendors.controller';
import { VendorsService } from './vendors.service';

function fakeData() {
  const db: Record<string, any> = {
    vendors: [{ id: 'V001', name: 'Elite', userId: 'U002' }],
    events: [
      { id: 'E1', name: 'Done Gala', status: 'completed', clientId: 'U004', client: 'Emily', vendorId: 'V001' },
      { id: 'E2', name: 'Second Done', status: 'completed', clientId: 'U004', client: 'Emily', vendorId: 'V001' },
      { id: 'E3', name: 'Future', status: 'confirmed', clientId: 'U004', vendorId: 'V001' },
    ],
    vendorFeedback: [],
    notifications: [],
  };
  const find = (n: string, id: string) => {
    const row = db[n].find((r: any) => r.id === id);
    if (!row) throw new NotFoundException(id);
    return row;
  };
  return {
    db, find,
    collection: (n: string) => db[n],
    create: (n: string, _p: string, payload: any) => { const row = { id: `VF${db[n].length + 1}`, ...payload }; db[n].push(row); return row; },
    update: (n: string, id: string, patch: any) => Object.assign(find(n, id), patch),
    notifyUser: (userId: string, title: string, message: string) => db.notifications.push({ userId, title, message }),
    vendorUserId: (vendorId: string) => db.vendors.find((v: any) => v.id === vendorId)?.userId,
  } as any;
}

const emily = { id: 'U004', name: 'Emily', role: 'client' };
const david = { id: 'U008', name: 'David', role: 'client' };

describe('client feedback about the vendor', () => {
  it('the owning client rates a completed event; the vendor is notified', async () => {
    const data = fakeData();
    (await new VendorsService(data).giveFeedback('E1', { stars: 4, comment: 'Nice' }, emily));
    expect(data.db.vendorFeedback).toEqual([expect.objectContaining({ vendorId: 'V001', eventId: 'E1', stars: 4, clientId: 'U004' })]);
    expect(data.db.notifications[0]).toMatchObject({ userId: 'U002', message: expect.stringContaining('4/5') });
  });
  it('rating again EDITS (one per event), PATCH edits, PATCH with none -> 404', async () => {
    const data = fakeData();
    const svc = new VendorsService(data);
    await expect((async () => (await svc.editFeedback('E1', { stars: 3 }, emily)))()).rejects.toThrow(NotFoundException);
    (await svc.giveFeedback('E1', { stars: 2 }, emily));
    (await svc.giveFeedback('E1', { stars: 5, comment: 'changed' }, emily));
    expect(data.db.vendorFeedback).toHaveLength(1);
    expect(data.db.vendorFeedback[0]).toMatchObject({ stars: 5, comment: 'changed', updatedAt: expect.any(String) });
    (await svc.editFeedback('E1', { stars: 1 }, emily));
    expect(data.db.vendorFeedback[0].stars).toBe(1);
  });
  it('another client cannot rate or edit (403)', async () => {
    const svc = new VendorsService(fakeData());
    await expect((async () => (await svc.giveFeedback('E1', { stars: 5 }, david)))()).rejects.toThrow(ForbiddenException);
    await expect((async () => (await svc.editFeedback('E1', { stars: 5 }, david)))()).rejects.toThrow(ForbiddenException);
  });
  it('before the event is completed -> 400', async () => {
    await expect((async () => new VendorsService(fakeData()).giveFeedback('E3', { stars: 5 }, emily))()).rejects.toThrow(BadRequestException);
  });
  it('only the client role may give feedback (others get 403 from RolesGuard)', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, VendorsController.prototype.giveFeedback)).toEqual(['client']);
    expect(Reflect.getMetadata(ROLES_KEY, VendorsController.prototype.editFeedback)).toEqual(['client']);
  });
  it('the vendor average is recalculated after every rating and edit', async () => {
    const svc = new VendorsService(fakeData());
    expect((await svc.feedbackSummary('V001'))).toMatchObject({ rating: null, ratingCount: 0 });
    (await svc.giveFeedback('E1', { stars: 5 }, emily));
    (await svc.giveFeedback('E2', { stars: 4 }, emily));
    expect((await svc.feedbackSummary('V001'))).toMatchObject({ rating: 4.5, ratingCount: 2 });
    (await svc.editFeedback('E2', { stars: 2 }, emily));
    expect((await svc.feedbackSummary('V001'))).toMatchObject({ rating: 3.5, ratingCount: 2 });
  });
});
