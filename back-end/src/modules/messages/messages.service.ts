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
// Storage (PostgreSQL): event chats in `messages`, the admin chat in
// `admin_chat_messages`, "last opened" times in `message_reads`.
const EVENT_THREAD = /^(client|staff)-(.+)$/;

@Injectable()
export class MessagesService {
  // The gateway is optional so unit tests can build the service without sockets
  constructor(private readonly data: DataService, @Optional() private readonly gateway?: MessagesGateway) {}

  private async isVendorOf(event: any, user: any) {
    const vendor = (await this.data.collection('vendors')).find((v) => v.userId === user.id);
    if (!vendor) return false;
    return !event.vendorId || event.vendorId === vendor.id || (event.vendorIds || []).includes(vendor.id);
  }

  private async isStaffOn(event: any, user: any) {
    const member = (await this.data.collection('staff')).find(
      (s) => s.userId === user.id || (s.email && s.email.toLowerCase() === user.email?.toLowerCase()),
    );
    if (!member) return false;
    return (
      (member.assignedEvents || []).includes(event.id) ||
      (await this.data.collection('staffAssignments')).some((a) => a.staffId === member.id && a.eventId === event.id)
    );
  }

  private async assertCanAccess(threadId: string, user: any) {
    const match = threadId.match(EVENT_THREAD);
    if (!match) return;
    const [, audience, eventId] = match;
    const event: any = await this.data.find('events', eventId);

    const allowed =
      ['admin', 'superuser'].includes(user?.role) ||
      (user?.role === 'vendor' && (await this.isVendorOf(event, user))) ||
      (user?.role === 'client' && audience === 'client' && event.clientId === user.id) ||
      (user?.role === 'staff' && audience === 'staff' && (await this.isStaffOn(event, user)));
    if (!allowed) throw new ForbiddenException('You are not part of this conversation.');
  }

  async threads() {
    return this.data.getValue('messages');
  }

  async thread(id: string, user: any) {
    await this.assertCanAccess(id, user);
    const messages = await this.data.threadMessages(id);
    if (messages.length) return messages;
    if (EVENT_THREAD.test(id)) return []; // A conversation nobody has started yet
    throw new NotFoundException(`Message thread ${id} was not found.`);
  }

  async create(dto: CreateMessageDto, user: any) {
    await this.assertCanAccess(dto.threadId, user);
    const initials = String(user.name || '').split(/\s+/).map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
    const role = String(user.role || '');
    const now = new Date();
    // One INSERT; the data layer gives it the next MSG number in this thread
    const item = await this.data.addThreadMessage(dto.threadId, {
      sender: user.name,
      senderId: user.id,
      senderRole: role.charAt(0).toUpperCase() + role.slice(1),
      senderInitials: initials,
      initials,
      text: dto.text,
      avatar: dto.avatar,
      createdAt: now.toISOString(),
      time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    });
    // Live delivery: only the people in this conversation get it
    this.gateway?.emitToUsers(await this.participantsOf(dto.threadId), 'message:new', { threadId: dto.threadId, message: item });
    return item;
  }

  // ── Who is in a conversation (used for live delivery) ─────────────────────
  // client-<event>: the event's client + the vendor(s) running it
  // staff-<event>:  the vendor(s) + the staff assigned to it (not declined)
  async participantsOf(threadId: string): Promise<string[]> {
    const match = threadId.match(EVENT_THREAD);
    if (!match) return [];
    const [, audience, eventId] = match;
    const event: any = (await this.data.collection('events')).find((e) => e.id === eventId);
    if (!event) return [];
    const vendorIds = [event.vendorId, ...(event.vendorIds || [])].filter(Boolean);
    const vendorUsers = (await this.data.collection('vendors'))
      .filter((v: any) => v.userId && (!vendorIds.length || vendorIds.includes(v.id)))
      .map((v: any) => v.userId);
    if (audience === 'client') return [event.clientId, ...vendorUsers];

    const staff = await this.data.collection('staff');
    const users = await this.data.collection('users');
    const staffUsers = (await this.data.collection('staffAssignments'))
      .filter((a) => a.eventId === eventId && !['rejected', 'declined'].includes(String(a.status).toLowerCase()))
      .map((a) => {
        const member: any = staff.find((s) => s.id === a.staffId);
        if (!member) return undefined;
        return member.userId || users.find((u) => u.email.toLowerCase() === String(member.email || '').toLowerCase())?.id;
      });
    return [...vendorUsers, ...staffUsers] as string[];
  }

  // ── Admin support chat (one conversation per person, with the admin team) ──
  // Each message is one row; nobody can overwrite the list, and a person only
  // ever receives their own conversation (admins see all of them).

  // A message belongs to a person's conversation when they sent it or it was sent to them
  private isMine(message: any, email: string) {
    const me = email.toLowerCase();
    return String(message.senderEmail || '').toLowerCase() === me || String(message.recipientEmail || '').toLowerCase() === me;
  }

  async adminChat(user: any) {
    const list = await this.data.collection('adminChatMessages');
    const sorted = [...list].sort((a: any, b: any) => String(a.createdAt || a.timestamp).localeCompare(String(b.createdAt || b.timestamp)));
    return isAdminRole(user) ? sorted : sorted.filter((m) => this.isMine(m, String(user.email || '')));
  }

  async postAdminChat(dto: AdminChatDto, user: any) {
    const fromAdmin = isAdminRole(user);
    // The bug this fixes: admin replies used to be saved with no recipientEmail,
    // so nobody ever saw them. An admin must now say who the reply is for.
    if (fromAdmin && !dto.recipientEmail) throw new BadRequestException('Choose who this reply is for (recipientEmail).');
    const now = new Date();
    const role = String(user.role || '');
    const message = await this.data.create('adminChatMessages', 'msg_', {
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
    });

    // Live: the whole admin team, the sender (other tabs) and the recipient
    const users = await this.data.collection('users');
    const admins = users.filter((u) => ['admin', 'superuser'].includes(String(u.role).toLowerCase())).map((u) => u.id);
    const recipient = message.recipientEmail ? users.find((u) => u.email.toLowerCase() === message.recipientEmail)?.id : undefined;
    this.gateway?.emitToUsers([...admins, user.id, recipient], 'admin-chat:new', message);
    return message;
  }

  // ── Unread counts ─────────────────────────────────────────────────────────
  // message_reads = when each user last opened each conversation. A message is
  // unread when someone else sent it after that time.

  async markRead(threadId: string, user: any) {
    if (threadId !== ADMIN_CHAT && !threadId.startsWith(`${ADMIN_CHAT}:`)) await this.assertCanAccess(threadId, user);
    const readAt = await this.data.markRead(user.id, threadId);
    return { threadId, readAt };
  }

  /**
   * { threads: { threadId: count }, total } for the caller.
   *   client / vendor / staff: their event conversations + "admin-chat"
   *   admin / superuser:       one "admin-chat:<email>" entry per person
   */
  async unread(user: any) {
    const myReads = await this.data.readsFor(user.id);
    const after = (key: string, time?: string) => !myReads[key] || String(time || '') > myReads[key];
    const threads: Record<string, number> = {};

    if (isAdminRole(user)) {
      (await this.adminChat(user))
        .filter((m: any) => !['admin', 'superuser'].includes(String(m.senderRole || '').toLowerCase()) && m.senderEmail)
        .forEach((m: any) => {
          const key = `${ADMIN_CHAT}:${String(m.senderEmail).toLowerCase()}`;
          if (after(key, m.timestamp || m.createdAt)) threads[key] = (threads[key] || 0) + 1;
        });
    } else {
      const all = ((await this.data.getValue('messages')) || {}) as Record<string, any[]>;
      for (const [threadId, list] of Object.entries(all)) {
        if (!EVENT_THREAD.test(threadId)) continue;
        try {
          await this.assertCanAccess(threadId, user);
        } catch {
          continue; // not my conversation (or its event was deleted)
        }
        const count = (list || []).filter((m) => m.senderId !== user.id && after(threadId, m.createdAt)).length;
        if (count) threads[threadId] = count;
      }
      const mine = (await this.adminChat(user)).filter((m: any) => String(m.senderEmail || '').toLowerCase() !== String(user.email).toLowerCase());
      const count = mine.filter((m: any) => after(ADMIN_CHAT, m.timestamp || m.createdAt)).length;
      if (count) threads[ADMIN_CHAT] = count;
    }
    return { threads, total: Object.values(threads).reduce((sum, n) => sum + n, 0) };
  }
}
