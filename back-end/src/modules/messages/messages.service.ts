import { BadRequestException, ForbiddenException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { DataService } from '../../database/data.service';
import { AdminChatDto, CreateMessageDto } from './dto';
import { MessagesGateway } from './messages.gateway';

// Key used for the admin support chat in unread counts / read markers
export const ADMIN_CHAT = 'admin-chat';
const isAdminRole = (user: any) => ['admin', 'superuser'].includes(String(user?.role || '').toLowerCase());

// Each event has two conversations:
//   client-<eventId>  the vendor and the event's client
//   staff-<eventId>   the vendor and the staff working on the event
// Who sent a message comes from the signed-in user, never from the request body.
const EVENT_THREAD = /^(client|staff)-(.+)$/;

@Injectable()
export class MessagesService {
  // The gateway is optional so unit tests can build the service without sockets
  constructor(private readonly data: DataService, @Optional() private readonly gateway?: MessagesGateway) {}

  private isVendorOf(event: any, user: any) {
    const vendor = this.data.collection('vendors').find((v) => v.userId === user.id);
    if (!vendor) return false;
    return !event.vendorId || event.vendorId === vendor.id || (event.vendorIds || []).includes(vendor.id);
  }

  private isStaffOn(event: any, user: any) {
    const member = this.data
      .collection('staff')
      .find((s) => s.userId === user.id || (s.email && s.email.toLowerCase() === user.email?.toLowerCase()));
    if (!member) return false;
    return (
      (member.assignedEvents || []).includes(event.id) ||
      this.data.collection('staffAssignments').some((a) => a.staffId === member.id && a.eventId === event.id)
    );
  }

  private assertCanAccess(threadId: string, user: any) {
    const match = threadId.match(EVENT_THREAD);
    if (!match) return;
    const [, audience, eventId] = match;
    const event = this.data.find('events', eventId);

    const allowed =
      ['admin', 'superuser'].includes(user?.role) ||
      (user?.role === 'vendor' && this.isVendorOf(event, user)) ||
      (user?.role === 'client' && audience === 'client' && event.clientId === user.id) ||
      (user?.role === 'staff' && audience === 'staff' && this.isStaffOn(event, user));
    if (!allowed) throw new ForbiddenException('You are not part of this conversation.');
  }

  threads() { return this.data.getValue('messages'); }

  thread(id: string, user: any) {
    this.assertCanAccess(id, user);
    const messages = (this.data.getValue('messages') as Record<string, any[]>)[id];
    if (messages) return messages;
    if (EVENT_THREAD.test(id)) return []; // A conversation nobody has started yet
    throw new NotFoundException(`Message thread ${id} was not found.`);
  }

  create(dto: CreateMessageDto, user: any) {
    this.assertCanAccess(dto.threadId, user);
    const all = this.data.getValue('messages') as Record<string, any[]>;
    all[dto.threadId] = all[dto.threadId] || [];

    const initials = String(user.name || '').split(/\s+/).map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
    const role = String(user.role || '');
    const now = new Date();
    const item = {
      id: `MSG${String(all[dto.threadId].length + 1).padStart(3, '0')}`,
      threadId: dto.threadId,
      sender: user.name,
      senderId: user.id,
      senderRole: role.charAt(0).toUpperCase() + role.slice(1),
      senderInitials: initials,
      initials,
      text: dto.text,
      avatar: dto.avatar,
      createdAt: now.toISOString(),
      time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };
    all[dto.threadId].push(item);
    // getValue() hands back the live object, so the push above only changed
    // memory. Without this the message is lost on restart -- it would survive
    // only if some unrelated write happened to flush the file first.
    this.data.save();
    // Live delivery: only the people in this conversation get it
    this.gateway?.emitToUsers(this.participantsOf(dto.threadId), 'message:new', { threadId: dto.threadId, message: item });
    return item;
  }

  // ── Who is in a conversation (used for live delivery) ─────────────────────
  // client-<event>: the event's client + the vendor(s) running it
  // staff-<event>:  the vendor(s) + the staff assigned to it (not declined)
  participantsOf(threadId: string): string[] {
    const match = threadId.match(EVENT_THREAD);
    if (!match) return [];
    const [, audience, eventId] = match;
    const event: any = this.data.collection('events').find((e) => e.id === eventId);
    if (!event) return [];
    const vendorIds = [event.vendorId, ...(event.vendorIds || [])].filter(Boolean);
    const vendorUsers = this.data.collection('vendors')
      .filter((v: any) => v.userId && (!vendorIds.length || vendorIds.includes(v.id)))
      .map((v: any) => v.userId);
    if (audience === 'client') return [event.clientId, ...vendorUsers];

    const staffUsers = this.data.collection('staffAssignments')
      .filter((a) => a.eventId === eventId && !['rejected', 'declined'].includes(String(a.status).toLowerCase()))
      .map((a) => {
        const member: any = this.data.collection('staff').find((s) => s.id === a.staffId);
        if (!member) return undefined;
        return member.userId || this.data.collection('users').find((u) => u.email.toLowerCase() === String(member.email || '').toLowerCase())?.id;
      });
    return [...vendorUsers, ...staffUsers] as string[];
  }

  // ── Admin support chat (one conversation per person, with the admin team) ──
  // Stored in the existing `adminChatMessages` list so Issue Tracking keeps
  // working. Unlike the old PUT /state, this only ever APPENDS one message and
  // only returns the caller's own conversation (admins see all of them).
  private adminChatList(): any[] {
    const list = this.data.getValue('adminChatMessages');
    if (Array.isArray(list)) return list;
    this.data.setValue('adminChatMessages', []);
    return this.data.getValue('adminChatMessages') as any[];
  }

  // A message belongs to a person's conversation when they sent it or it was sent to them
  private isMine(message: any, email: string) {
    const me = email.toLowerCase();
    return String(message.senderEmail || '').toLowerCase() === me || String(message.recipientEmail || '').toLowerCase() === me;
  }

  adminChat(user: any) {
    const list = this.adminChatList();
    return isAdminRole(user) ? list : list.filter((m) => this.isMine(m, String(user.email || '')));
  }

  postAdminChat(dto: AdminChatDto, user: any) {
    const fromAdmin = isAdminRole(user);
    // The bug this fixes: admin replies used to be saved with no recipientEmail,
    // so nobody ever saw them. An admin must now say who the reply is for.
    if (fromAdmin && !dto.recipientEmail) throw new BadRequestException('Choose who this reply is for (recipientEmail).');
    const now = new Date();
    const role = String(user.role || '');
    const message = {
      id: `msg_${now.getTime()}_${Math.floor(Math.random() * 1000)}`,
      sender: user.name,
      senderId: user.id,
      senderRole: role.charAt(0).toUpperCase() + role.slice(1),
      senderEmail: user.email,
      recipientEmail: fromAdmin ? String(dto.recipientEmail).toLowerCase() : undefined,
      text: dto.text.trim(),
      type: dto.type || 'message',
      issueId: dto.issueId,
      timestamp: now.toISOString(),
      createdAt: now.toISOString(),
    };
    this.adminChatList().push(message);
    this.data.save();

    // Live: the whole admin team, the sender (other tabs) and the recipient
    const admins = this.data.collection('users').filter((u) => ['admin', 'superuser'].includes(String(u.role).toLowerCase())).map((u) => u.id);
    const recipient = message.recipientEmail
      ? this.data.collection('users').find((u) => u.email.toLowerCase() === message.recipientEmail)?.id
      : undefined;
    this.gateway?.emitToUsers([...admins, user.id, recipient], 'admin-chat:new', message);
    return message;
  }

  // ── Unread counts ─────────────────────────────────────────────────────────
  // messageReads = { userId: { threadId: ISO time last opened } }. A message is
  // unread when someone else sent it after that time.
  private reads(): Record<string, Record<string, string>> {
    const value = this.data.getValue('messageReads');
    if (value && typeof value === 'object') return value as any;
    this.data.setValue('messageReads', {});
    return this.data.getValue('messageReads') as any;
  }

  markRead(threadId: string, user: any) {
    if (threadId !== ADMIN_CHAT && !threadId.startsWith(`${ADMIN_CHAT}:`)) this.assertCanAccess(threadId, user);
    const reads = this.reads();
    reads[user.id] = { ...(reads[user.id] || {}), [threadId]: new Date().toISOString() };
    this.data.save();
    return { threadId, readAt: reads[user.id][threadId] };
  }

  /**
   * { threads: { threadId: count }, total } for the caller.
   *   client / vendor / staff: their event conversations + "admin-chat"
   *   admin / superuser:       one "admin-chat:<email>" entry per person
   */
  unread(user: any) {
    const myReads = this.reads()[user.id] || {};
    const after = (key: string, time?: string) => !myReads[key] || String(time || '') > myReads[key];
    const threads: Record<string, number> = {};

    if (isAdminRole(user)) {
      this.adminChatList()
        .filter((m) => !['admin', 'superuser'].includes(String(m.senderRole || '').toLowerCase()) && m.senderEmail)
        .forEach((m) => {
          const key = `${ADMIN_CHAT}:${String(m.senderEmail).toLowerCase()}`;
          if (after(key, m.timestamp || m.createdAt)) threads[key] = (threads[key] || 0) + 1;
        });
    } else {
      const all = (this.data.getValue('messages') || {}) as Record<string, any[]>;
      Object.entries(all).forEach(([threadId, list]) => {
        if (!EVENT_THREAD.test(threadId)) return;
        try {
          this.assertCanAccess(threadId, user);
        } catch {
          return; // not my conversation (or its event was deleted)
        }
        const count = (list || []).filter((m) => m.senderId !== user.id && after(threadId, m.createdAt)).length;
        if (count) threads[threadId] = count;
      });
      const mine = this.adminChat(user).filter((m) => String(m.senderEmail || '').toLowerCase() !== String(user.email).toLowerCase());
      const count = mine.filter((m) => after(ADMIN_CHAT, m.timestamp || m.createdAt)).length;
      if (count) threads[ADMIN_CHAT] = count;
    }
    return { threads, total: Object.values(threads).reduce((sum, n) => sum + n, 0) };
  }
}
