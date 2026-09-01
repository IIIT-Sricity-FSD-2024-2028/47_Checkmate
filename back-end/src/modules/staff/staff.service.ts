import { Injectable, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { DataService } from '../../database/data.service';
import { hashPassword, verifyPassword } from '../../common/security/password';
import { CreateStaffAssignmentDto, CreateStaffDto, UpdateStaffAssignmentDto, UpdateStaffDto } from './dto';

@Injectable()
export class StaffService {
  constructor(private readonly data: DataService) {}
  findAll() { return this.data.collection('staff'); }
  findOne(id: string) { return this.data.find('staff', id); }
  create(dto: CreateStaffDto) { return this.data.create('staff', 'S', dto); }
  update(id: string, dto: UpdateStaffDto) { return this.data.update('staff', id, dto); }
  remove(id: string) { return this.data.remove('staff', id); }
  
  signup(dto: any) {
    const exists = this.data.collection('users').some((row) => row.email.toLowerCase() === dto.email.toLowerCase());
    if (exists) throw new BadRequestException('An account with this email already exists.');

    const user = this.data.create('users', 'U', {
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      role: 'Staff',
      status: 'Active',
      created: new Date().toISOString().slice(0, 10),
      passwordHash: hashPassword(dto.password),
    });

    this.data.create('staff', 'S', {
      name: dto.name,
      role: 'Staff',
      phone: dto.phone || '',
      email: dto.email,
      status: 'Active',
      workload: 0,
      events: 0,
    });

    const { passwordHash, ...safeUser } = user;
    return { user: safeUser, role: 'staff', token: `session-${user.id}-${Date.now()}` };
  }

  login(dto: any) {
    const user = this.data.collection('users').find((row) => row.email.toLowerCase() === dto.email.toLowerCase());
    if (!user || user.role !== 'Staff' || !verifyPassword(dto.password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid staff credentials.');
    }
    if (!['Active', 'active'].includes(user.status)) throw new UnauthorizedException('This account is not active.');

    const { passwordHash, ...safeUser } = user;
    return { user: safeUser, role: 'staff', token: `session-${user.id}-${Date.now()}` };
  }

  getProfile(email: string) {
    const profile = this.data.collection('staff').find((row: any) => row.email && row.email.toLowerCase() === email.toLowerCase());
    if (!profile) throw new NotFoundException('Staff profile not found');
    return profile;
  }

  assignments() { return this.data.collection('staffAssignments'); }
  createAssignment(dto: CreateStaffAssignmentDto) {
    return this.data.create('staffAssignments', 'A', { status: 'assigned', assignedAt: new Date().toISOString(), ...dto });
  }
  updateAssignment(id: string, dto: UpdateStaffAssignmentDto) { return this.data.update('staffAssignments', id, dto); }
  removeAssignment(id: string) { return this.data.remove('staffAssignments', id); }
}
