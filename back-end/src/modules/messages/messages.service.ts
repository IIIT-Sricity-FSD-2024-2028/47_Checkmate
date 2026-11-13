import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DataService } from '../../database/data.service';
import { CreateMessageDto } from './dto';

// Each event has two conversations:
//   client-<eventId>  the vendor and the event's client
//   staff-<eventId>   the vendor and the staff working on the event
// Who sent a message comes from the signed-in user, never from the request body.
const EVENT_THREAD = /^(client|staff)-(.+)$/;

@Injectable()
export class MessagesService {
  constructor(private readonly data: DataService) {}

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
    return item;
  }
}
