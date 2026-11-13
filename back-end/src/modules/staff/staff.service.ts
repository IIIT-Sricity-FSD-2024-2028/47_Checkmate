import { Injectable, BadRequestException, ForbiddenException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataService } from '../../database/data.service';
import { hashPassword, verifyPassword } from '../../common/security/password';
import { CreateStaffAssignmentDto, CreateStaffDto, StaffProgressDto, UpdateStaffAssignmentDto, UpdateStaffDto } from './dto';

const CLOSED_ASSIGNMENTS = ['rejected', 'declined', 'completed'];
const FINISHED_EVENTS = ['rejected', 'completed', 'cancelled'];

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
  update(id: string, dto: UpdateStaffDto) { return this.data.update('staff', id, dto); }
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
  private assertFree(staffId: string, eventId: string) {
    const clash = this.data.collection('staffAssignments').find((a) => {
      if (a.staffId !== staffId || a.eventId === eventId) return false;
      if (CLOSED_ASSIGNMENTS.includes(String(a.status).toLowerCase())) return false;
      const event = this.data.collection('events').find((e) => e.id === a.eventId);
      return event ? !FINISHED_EVENTS.includes(String(event.status).toLowerCase()) : false;
    });
    if (clash) throw new BadRequestException(`${clash.staffName} is already assigned to ${clash.eventName}.`);
  }

  createAssignment(dto: CreateStaffAssignmentDto) {
    this.assertFree(dto.staffId, dto.eventId);
    return this.data.create('staffAssignments', 'A', { status: 'assigned', assignedAt: new Date().toISOString(), ...dto });
  }

  updateAssignment(id: string, dto: UpdateStaffAssignmentDto) {
    const existing = this.data.find('staffAssignments', id);
    if (dto.staffId || dto.eventId) {
      this.assertFree(dto.staffId || existing.staffId, dto.eventId || existing.eventId);
    }
    return this.data.update('staffAssignments', id, dto);
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
