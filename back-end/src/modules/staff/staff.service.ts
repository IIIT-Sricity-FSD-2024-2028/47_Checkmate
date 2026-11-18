import { Injectable, BadRequestException, ForbiddenException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataService } from '../../database/data.service';
import { hashPassword, verifyPassword } from '../../common/security/password';
import { CreateStaffAssignmentDto, CreateStaffDto, RateStaffDto, StaffProfilesQueryDto, StaffProgressDto, UpdateStaffAssignmentDto, UpdateStaffDto } from './dto';
import { buildPublicProfile, busyEventFor, completedEventIds } from './staff-profile';
import { eventWindow } from '../resources/resource-availability';
// Fields a staff member may change on their own staff record
const STAFF_SELF_FIELDS = ['workload'];
// Fields a staff member may change on their own assignment (Assigned Events + Task Board)
const STAFF_ASSIGNMENT_FIELDS = ['status', 'respondedAt', 'declineReason', 'tasks'];

// Staff are stored twice on purpose: a `users` row (so they can log in) and a
// `staff` row (the operational record vendors assign work to). Both are
// created together at signup and linked by email.
@Injectable()
export class StaffService {
  constructor(
    private readonly data: DataService,
    private readonly jwt: JwtService,
  ) {}

  /** Same signed-token shape AuthService issues, so one guard validates both. */
  private issueToken(user: { id: string; email: string }) {
    return this.jwt.sign({ sub: user.id, email: user.email, role: 'staff' });
  }
  findAll() { return this.data.collection('staff'); }
  findOne(id: string) { return this.data.find('staff', id); }
  create(dto: CreateStaffDto) { return this.data.create('staff', 'S', dto); }
  // Vendors/admins may edit any staff record. A staff member may only edit
  // their OWN record, and only the fields the staff portal needs (workload,
  // which the Task Board adjusts) -- never role, vendor, status or name.
  update(id: string, dto: UpdateStaffDto, user?: { id?: string; email?: string; role?: string }) {
    if (String(user?.role || '').toLowerCase() === 'staff') {
      const member = this.data.find('staff', id);
      const isOwner = (member.userId && member.userId === user?.id) || (member.email && member.email.toLowerCase() === String(user?.email || '').toLowerCase());
      if (!isOwner) throw new ForbiddenException('You can only update your own staff record.');
      const notAllowed = Object.keys(dto).filter((field) => !STAFF_SELF_FIELDS.includes(field));
      if (notAllowed.length) throw new ForbiddenException(`Staff cannot change: ${notAllowed.join(', ')}.`);
    }
    return this.data.update('staff', id, dto);
  }
  remove(id: string) { return this.data.remove('staff', id); }
  
  // Separate from /auth/login so a non-staff account cannot sign in through the
  // staff portal -- note the explicit role !== 'Staff' check below.
  login(dto: any) {
    const user = this.data.collection('users').find((row) => row.email.toLowerCase() === dto.email.toLowerCase());
    if (!user || user.role !== 'Staff' || !verifyPassword(dto.password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid staff credentials.');
    }
    if (!['Active', 'active'].includes(user.status)) throw new UnauthorizedException('This account is not active.');

    const { passwordHash, ...safeUser } = user;
    return { user: safeUser, role: 'staff', token: this.issueToken(user) };
  }

  getProfile(email: string) {
    const profile = this.data.collection('staff').find((row: any) => row.email && row.email.toLowerCase() === email.toLowerCase());
    if (!profile) throw new NotFoundException('Staff profile not found');
    return profile;
  }

  // staffAssignments is the join between a staff member and an event. Creating or
  // changing one makes DataService recompute that person's workload automatically.
  assignments() { return this.data.collection('staffAssignments'); }
  // One person, one event at a time, however the assignment is made. More work on
  // the same event is fine.
  // Date-based: only work whose date/time overlaps this event's blocks the
  // assignment, so someone busy on another day can still be booked.
  private assertFree(staffId: string, eventId: string) {
    const event = this.data.collection('events').find((e) => e.id === eventId);
    if (!event) return; // unknown event: nothing to compare against
    const clash = busyEventFor(staffId, eventWindow(event as any), this.data.collection('staffAssignments') as any, this.data.collection('events') as any, eventId);
    if (clash) {
      const member = this.data.collection('staff').find((s) => s.id === staffId);
      throw new BadRequestException(`${member?.name || staffId} is already working on ${clash.name} at that time.`);
    }
  }

  // ── Profiles & ratings ────────────────────────────────────────────────────
  // Everyone signed in (clients too) may read these; they hold no phone/email.
  profiles(query: StaffProfilesQueryDto = {}) {
    const window = query.date ? { date: query.date, endDate: query.endDate, time: query.time, endTime: query.endTime } : undefined;
    const data = {
      staffAssignments: this.data.collection('staffAssignments') as any,
      events: this.data.collection('events') as any,
      staffRatings: this.data.collection('staffRatings') as any,
    };
    return this.data.collection('staff').map((member) => buildPublicProfile(member, data, window, query.excludeEventId));
  }

  profile(id: string) {
    const member = this.data.find('staff', id);
    return this.profiles().find((p) => p.id === member.id);
  }

  // Only the vendor who ran the event may rate, only after it is completed,
  // only staff who worked it, and only once per staff member per event.
  // (Other roles never get here: the controller allows 'vendor' only.)
  rate(staffId: string, dto: RateStaffDto, user: { id: string; name?: string }) {
    const member = this.data.find('staff', staffId);
    const event = this.data.find('events', dto.eventId);
    const vendor = this.data.collection('vendors').find((v: any) => v.userId === user.id);
    if (!vendor) throw new ForbiddenException('Only a vendor account can rate staff.');
    const ownsEvent = event.vendorId ? event.vendorId === vendor.id || (event.vendorIds || []).includes(vendor.id) : member.vendorId === vendor.id;
    if (!ownsEvent) throw new ForbiddenException('You can only rate staff on your own events.');
    if (String(event.status).toLowerCase() !== 'completed') {
      throw new BadRequestException('Staff can be rated only after the event is completed.');
    }
    const worked = completedEventIds(member.id, this.data.collection('staffAssignments') as any, [event as any]);
    if (!worked.length) throw new BadRequestException(`${member.name} did not work on ${event.name}.`);
    const already = this.data.collection('staffRatings').some((r) => r.staffId === member.id && r.eventId === event.id);
    if (already) throw new BadRequestException(`${member.name} was already rated for ${event.name}.`);

    this.data.create('staffRatings', 'RT', {
      staffId: member.id,
      eventId: event.id,
      eventName: event.name,
      vendorId: vendor.id,
      ratedBy: user.id,
      ratedByName: user.name || vendor.name,
      stars: dto.stars,
      comment: dto.comment?.trim() || '',
      createdAt: new Date().toISOString(),
    });
    return this.profile(member.id);
  }

  /** Ratings this vendor already gave on one event: { staffId: stars } */
  ratingsForEvent(eventId: string) {
    const result: Record<string, { stars: number; comment: string }> = {};
    this.data.collection('staffRatings').filter((r) => r.eventId === eventId).forEach((r) => {
      result[r.staffId] = { stars: r.stars, comment: r.comment || '' };
    });
    return result;
  }

  createAssignment(dto: CreateStaffAssignmentDto) {
    this.assertFree(dto.staffId, dto.eventId);
    return this.data.create('staffAssignments', 'A', { status: 'assigned', assignedAt: new Date().toISOString(), ...dto });
  }

  // Staff may only answer THEIR OWN assignment (accept / decline) and move its
  // tasks; vendors and admins may change anything. Declining needs a reason,
  // which is saved and sent to the vendor running the event.
  updateAssignment(id: string, dto: UpdateStaffAssignmentDto, user?: { id?: string; name?: string; email?: string; role?: string }) {
    const existing = this.data.find('staffAssignments', id);
    const isStaff = String(user?.role || '').toLowerCase() === 'staff';
    if (isStaff) {
      const member = this.data.collection('staff').find((s) => s.id === existing.staffId);
      const isOwner = member && ((member.userId && member.userId === user?.id) || (member.email && member.email.toLowerCase() === String(user?.email || '').toLowerCase()));
      if (!isOwner) throw new ForbiddenException('You can only answer your own assignments.');
      const notAllowed = Object.keys(dto).filter((field) => !STAFF_ASSIGNMENT_FIELDS.includes(field));
      if (notAllowed.length) throw new ForbiddenException(`Staff cannot change: ${notAllowed.join(', ')}.`);
      if (dto.status && !['accepted', 'rejected', 'declined'].includes(String(dto.status).toLowerCase())) {
        throw new ForbiddenException('Staff can only accept or decline an assignment.');
      }
    }
    if (dto.staffId || dto.eventId) {
      this.assertFree(dto.staffId || existing.staffId, dto.eventId || existing.eventId);
    }

    const declining = ['rejected', 'declined'].includes(String(dto.status || '').toLowerCase()) && !['rejected', 'declined'].includes(String(existing.status).toLowerCase());
    if (declining && isStaff && !String(dto.declineReason || '').trim()) {
      throw new BadRequestException('Please give a reason for declining.');
    }
    const patch: any = { ...dto };
    if (declining) {
      patch.declinedAt = new Date().toISOString();
      patch.declinedBy = user?.id ? { id: user.id, name: user.name || existing.staffName, role: String(user.role || '').toLowerCase() } : undefined;
    }
    const updated: any = this.data.update('staffAssignments', id, patch);

    if (declining) {
      const event: any = this.data.collection('events').find((e) => e.id === existing.eventId);
      this.data.notifyUser(
        this.data.vendorUserId(event?.vendorId),
        `${existing.staffName} declined ${existing.eventName}`,
        `${existing.staffName} declined the assignment for ${existing.eventName}. Reason: ${dto.declineReason || 'No reason given'}`,
        'error',
        `/vendor/events/${existing.eventId}/review`,
      );
    }
    return updated;
  }

  // Staff report on their own work, and only while the event is running.
  updateProgress(id: string, dto: StaffProgressDto, user: any) {
    const assignment = this.data.find('staffAssignments', id);
    const member = this.data.collection('staff').find((s) => s.id === assignment.staffId);
    const isOwner = member?.userId === user?.id || member?.email?.toLowerCase() === user?.email?.toLowerCase();
    if (!isOwner) throw new ForbiddenException('You can only update your own progress.');

    const event = this.data.collection('events').find((e) => e.id === assignment.eventId);
    if (String(event?.status).toLowerCase() !== 'live') {
      throw new BadRequestException('Progress can only be updated while the event is live.');
    }
    if (String(assignment.status).toLowerCase() !== 'accepted') {
      throw new BadRequestException('Please accept this assignment first.');
    }

    return this.data.update('staffAssignments', id, {
      workStatus: dto.workStatus,
      progressNote: dto.note ?? assignment.progressNote,
      progressUpdatedAt: new Date().toISOString(),
    } as any);
  }

  removeAssignment(id: string) { return this.data.remove('staffAssignments', id); }
}
