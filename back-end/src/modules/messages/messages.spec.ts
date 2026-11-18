/**
 * Unit tests for messaging:
 *   - live delivery goes only to the people in the conversation
 *   - admin chat: each person sees only their own conversation; an admin
 *     reply must name its recipient (the old recipientEmail bug)
 *   - unread counts and mark-as-read
 * In-memory fake DataService + a fake gateway that records what was pushed.
 */
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MessagesService } from './messages.service';

function fakeData() {
  const db: Record<string, any> = {
    users: [
      { id: 'U001', email: 'admin@x.com', role: 'Admin' },
      { id: 'U002', email: 'sarah@x.com', role: 'Vendor' },
      { id: 'U003', email: 'mike@x.com', role: 'Staff' },
      { id: 'U004', email: 'emily@x.com', role: 'Client' },
    ],
    vendors: [{ id: 'V001', userId: 'U002' }],
    events: [{ id: 'E1', name: 'Gala', clientId: 'U004', vendorId: 'V001' }],
    staff: [{ id: 'S1', userId: 'U003', email: 'mike@x.com' }],
    staffAssignments: [{ staffId: 'S1', eventId: 'E1', status: 'accepted' }],
    messages: {}, adminChatMessages: [], messageReads: {},
  };
  return {
    db,
    collection: (n: string) => db[n],
    find: (n: string, id: string) => {
      const row = db[n].find((r: any) => r.id === id);
      if (!row) throw new NotFoundException(id);
      return row;
    },
    getValue: (n: string) => db[n],
    setValue: (n: string, v: any) => (db[n] = v),
    save: () => undefined,
  } as any;
}

const sarah = { id: 'U002', name: 'Sarah', email: 'sarah@x.com', role: 'vendor' };
const emily = { id: 'U004', name: 'Emily', email: 'emily@x.com', role: 'client' };
const mike = { id: 'U003', name: 'Mike', email: 'mike@x.com', role: 'staff' };
const admin = { id: 'U001', name: 'Aarav', email: 'admin@x.com', role: 'admin' };

function setup() {
  const data = fakeData();
  const pushed: Array<{ to: string[]; event: string }> = [];
  const gateway = { emitToUsers: (to: any[], event: string) => pushed.push({ to: to.filter(Boolean), event }) } as any;
  return { data, pushed, svc: new MessagesService(data, gateway) };
}

describe('live delivery goes only to the conversation', () => {
  it('client chat -> client + vendor, never the staff', () => {
    const { svc, pushed } = setup();
    svc.create({ threadId: 'client-E1', text: 'hi' }, sarah);
    expect(pushed[0].to.sort()).toEqual(['U002', 'U004']);
  });
  it('staff chat -> vendor + assigned staff, never the client', () => {
    const { svc, pushed } = setup();
    svc.create({ threadId: 'staff-E1', text: 'doors at 9' }, sarah);
    expect(pushed[0].to.sort()).toEqual(['U002', 'U003']);
  });
});

describe('admin chat', () => {
  it('an admin reply must name its recipient', () => {
    expect(() => setup().svc.postAdminChat({ text: 'hello' }, admin)).toThrow(BadRequestException);
  });
  it('each person sees only their own conversation; admins see all', () => {
    const { svc } = setup();
    svc.postAdminChat({ text: 'from mike' }, mike);
    svc.postAdminChat({ text: 'to mike', recipientEmail: 'mike@x.com' }, admin);
    svc.postAdminChat({ text: 'from emily' }, emily);
    expect(svc.adminChat(mike).map((m: any) => m.text)).toEqual(['from mike', 'to mike']);
    expect(svc.adminChat(emily).map((m: any) => m.text)).toEqual(['from emily']);
    expect(svc.adminChat(admin)).toHaveLength(3);
  });
  it('a reply is pushed to the recipient and the admin team', () => {
    const { svc, pushed } = setup();
    svc.postAdminChat({ text: 'to mike', recipientEmail: 'mike@x.com' }, admin);
    expect(pushed[0].to).toEqual(expect.arrayContaining(['U001', 'U003']));
    expect(pushed[0].to).not.toContain('U004');
  });
});

describe('unread counts', () => {
  it('counts messages from others until the conversation is opened', () => {
    const { svc } = setup();
    svc.create({ threadId: 'client-E1', text: 'one' }, sarah);
    svc.create({ threadId: 'client-E1', text: 'two' }, sarah);
    svc.create({ threadId: 'client-E1', text: 'mine' }, emily);
    expect(svc.unread(emily).threads['client-E1']).toBe(2);
    svc.markRead('client-E1', emily);
    expect(svc.unread(emily).threads['client-E1']).toBeUndefined();
    expect(svc.unread(mike).threads['client-E1']).toBeUndefined(); // not his conversation
  });
  it('admins get one count per person', () => {
    const { svc } = setup();
    svc.postAdminChat({ text: 'help' }, mike);
    expect(svc.unread(admin).threads['admin-chat:mike@x.com']).toBe(1);
  });
});
