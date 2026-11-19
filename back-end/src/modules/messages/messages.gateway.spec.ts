/**
 * Unit tests for the Socket.IO gateway (messages.gateway.ts):
 *   - a socket with a valid token joins ONLY its own room "user:<id>"
 *   - a bad / expired / inactive-user token is disconnected
 *   - emitToUsers sends to each listed user's room once, and nowhere else
 *   - end to end with MessagesService: a client-thread message reaches the
 *     client's and the vendor's rooms, never the staff member's
 * Fake sockets and a fake server record what happened; no network is used.
 */
import { JwtService } from '@nestjs/jwt';
import { NotFoundException } from '@nestjs/common';
import { MessagesGateway } from './messages.gateway';
import { MessagesService } from './messages.service';

const SECRET = 'gateway-test-secret-0123456789-abcdefghij';
const jwt = new JwtService({ secret: SECRET });

function fakeData() {
  const db: Record<string, any> = {
    users: [
      { id: 'U002', email: 'sarah@x.com', role: 'Vendor', status: 'Active' },
      { id: 'U003', email: 'mike@x.com', role: 'Staff', status: 'Active' },
      { id: 'U004', email: 'emily@x.com', role: 'Client', status: 'Active' },
      { id: 'U009', email: 'gone@x.com', role: 'Client', status: 'Inactive' },
    ],
    vendors: [{ id: 'V001', userId: 'U002' }],
    events: [{ id: 'E1', clientId: 'U004', vendorId: 'V001' }],
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

// A socket that remembers which rooms it joined and whether it was dropped
function fakeSocket(token?: string) {
  return {
    handshake: { auth: { token } },
    data: {} as any,
    rooms: [] as string[],
    emitted: [] as string[],
    disconnected: false,
    join(room: string) { this.rooms.push(room); },
    emit(event: string) { this.emitted.push(event); },
    disconnect() { this.disconnected = true; },
  };
}

// A server that records every to(room).emit(event)
function fakeServer() {
  const sent: Array<{ room: string; event: string }> = [];
  return { sent, to: (room: string) => ({ emit: (event: string) => sent.push({ room, event }) }) };
}

describe('gateway authentication', () => {
  it('a valid token joins only its own room', () => {
    const gw = new MessagesGateway(jwt, fakeData());
    const socket = fakeSocket(jwt.sign({ sub: 'U004' }));
    gw.handleConnection(socket as any);
    expect(socket.rooms).toEqual(['user:U004']);
    expect(socket.disconnected).toBe(false);
  });
  it('no token, a forged token, an expired token or an inactive user is disconnected', () => {
    const gw = new MessagesGateway(jwt, fakeData());
    const tokens = [
      undefined,
      new JwtService({ secret: 'some-other-secret-0123456789-abcdefghij' }).sign({ sub: 'U004' }),
      jwt.sign({ sub: 'U004' }, { expiresIn: -10 }),
      jwt.sign({ sub: 'U009' }),
    ];
    tokens.forEach((token) => {
      const socket = fakeSocket(token);
      gw.handleConnection(socket as any);
      expect(socket.disconnected).toBe(true);
      expect(socket.rooms).toEqual([]);
      expect(socket.emitted).toContain('auth:error');
    });
  });
});

describe('gateway delivery', () => {
  it('emitToUsers sends once per user room, skipping empty ids', () => {
    const gw = new MessagesGateway(jwt, fakeData());
    const server = fakeServer();
    gw.server = server as any;
    gw.emitToUsers(['U004', 'U002', 'U004', undefined], 'message:new', {});
    expect(server.sent).toEqual([
      { room: 'user:U004', event: 'message:new' },
      { room: 'user:U002', event: 'message:new' },
    ]);
  });
  it('a client-thread message reaches the client + vendor rooms, never the staff room', () => {
    const data = fakeData();
    const gw = new MessagesGateway(jwt, data);
    const server = fakeServer();
    gw.server = server as any;
    const service = new MessagesService(data, gw);
    service.create({ threadId: 'client-E1', text: 'hello' }, { id: 'U002', name: 'Sarah', role: 'vendor' });
    const rooms = server.sent.map((s) => s.room).sort();
    expect(rooms).toEqual(['user:U002', 'user:U004']);
    expect(rooms).not.toContain('user:U003');
  });
  it('a staff-thread message reaches the vendor + assigned staff, never the client', () => {
    const data = fakeData();
    const gw = new MessagesGateway(jwt, data);
    const server = fakeServer();
    gw.server = server as any;
    new MessagesService(data, gw).create({ threadId: 'staff-E1', text: 'doors at 9' }, { id: 'U003', name: 'Mike', role: 'staff', email: 'mike@x.com' });
    expect(server.sent.map((s) => s.room).sort()).toEqual(['user:U002', 'user:U003']);
  });
});
