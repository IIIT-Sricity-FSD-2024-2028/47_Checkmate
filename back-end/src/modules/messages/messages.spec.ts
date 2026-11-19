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
    // Same methods the PostgreSQL data layer offers for chats (data.service.ts)
    create: (n: string, _p: string, payload: any) => { db[n].push({ ...payload }); return { ...payload }; },
    threadMessages: (threadId: string) => db.messages[threadId] || [],
    addThreadMessage: (threadId: string, m: any) => {
      const list = (db.messages[threadId] = db.messages[threadId] || []);
      const row = { ...m, id: `MSG${String(list.length + 1).padStart(3, '0')}`, threadId };
      list.push(row);
      return row;
    },
    readsFor: (userId: string) => db.messageReads[userId] || {},
    // A little after the newest message, so "opened now" is always later than it
    markRead: (userId: string, key: string) => {
      const at = new Date(Date.now() + 1000).toISOString();
      db.messageReads[userId] = { ...(db.messageReads[userId] || {}), [key]: at };
      return at;
    },
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
  it('client chat -> client + vendor, never the staff', async () => {
    const { svc, pushed } = setup();
    (await svc.create({ threadId: 'client-E1', text: 'hi' }, sarah));
    expect(pushed[0].to.sort()).toEqual(['U002', 'U004']);
  });
  it('staff chat -> vendor + assigned staff, never the client', async () => {
    const { svc, pushed } = setup();
    (await svc.create({ threadId: 'staff-E1', text: 'doors at 9' }, sarah));
    expect(pushed[0].to.sort()).toEqual(['U002', 'U003']);
  });
});

describe('admin chat', () => {
  it('an admin reply must name its recipient', async () => {
    await expect((async () => setup().svc.postAdminChat({ text: 'hello' }, admin))()).rejects.toThrow(BadRequestException);
  });
  it('each person sees only their own conversation; admins see all', async () => {
    const { svc } = setup();
    (await svc.postAdminChat({ text: 'from mike' }, mike));
    (await svc.postAdminChat({ text: 'to mike', recipientEmail: 'mike@x.com' }, admin));
    (await svc.postAdminChat({ text: 'from emily' }, emily));
    expect((await svc.adminChat(mike)).map((m: any) => m.text)).toEqual(['from mike', 'to mike']);
    expect((await svc.adminChat(emily)).map((m: any) => m.text)).toEqual(['from emily']);
    expect((await svc.adminChat(admin))).toHaveLength(3);
  });
  it('a reply is pushed to the recipient and the admin team', async () => {
    const { svc, pushed } = setup();
    (await svc.postAdminChat({ text: 'to mike', recipientEmail: 'mike@x.com' }, admin));
    expect(pushed[0].to).toEqual(expect.arrayContaining(['U001', 'U003']));
    expect(pushed[0].to).not.toContain('U004');
  });
});

describe('unread counts', () => {
  it('counts messages from others until the conversation is opened', async () => {
    const { svc } = setup();
    (await svc.create({ threadId: 'client-E1', text: 'one' }, sarah));
    (await svc.create({ threadId: 'client-E1', text: 'two' }, sarah));
    (await svc.create({ threadId: 'client-E1', text: 'mine' }, emily));
    expect((await svc.unread(emily)).threads['client-E1']).toBe(2);
    (await svc.markRead('client-E1', emily));
    expect((await svc.unread(emily)).threads['client-E1']).toBeUndefined();
    expect((await svc.unread(mike)).threads['client-E1']).toBeUndefined(); // not his conversation
  });
  it('admins get one count per person', async () => {
    const { svc } = setup();
    (await svc.postAdminChat({ text: 'help' }, mike));
    expect((await svc.unread(admin)).threads['admin-chat:mike@x.com']).toBe(1);
  });
});
