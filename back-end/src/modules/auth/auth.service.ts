import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { hashPassword, verifyPassword } from '../../common/security/password';
import { DataService } from '../../database/data.service';
import { User } from '../../domain/models';
import { LoginDto, RegisterDto } from './dto';

@Injectable()
export class AuthService {
  constructor(private readonly data: DataService) {}

  login(dto: LoginDto) {
    const user = this.data.collection('users').find((row) => row.email.toLowerCase() === dto.email.toLowerCase());
    if (!user || !verifyPassword(dto.password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    if (!['Active', 'active'].includes(user.status)) {
      throw new UnauthorizedException('This account is not active.');
    }
    return this.session(user);
  }

  register(dto: RegisterDto) {
    const existingUser = this.data.collection('users').find((row) => row.email.toLowerCase() === dto.email.toLowerCase());
    if (existingUser) {
      throw new BadRequestException('This email is already registered. Please sign in instead.');
    }

    const user = this.data.create('users', 'U', {
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      role: dto.role,
      status: 'Active',
      created: new Date().toISOString().slice(0, 10),
      passwordHash: hashPassword(dto.password),
    });

    // Auto-create a staff record so the staff portal and vendor Manage Staff page see them
    if (dto.role === 'Staff') {
      const initials = dto.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
      const avatars = ['pink', 'teal', 'purple', 'green', 'orange'];
      const staffList = this.data.collection('staff');
      this.data.create('staff', 'S', {
        userId: user.id,
        name: dto.name,
        initials,
        role: 'Staff Member',
        phone: dto.phone || '',
        email: dto.email,
        workload: 0,
        status: 'available',
        avail: 'Available',
        events: 0,
        avatar: avatars[staffList.length % avatars.length],
        assignedEvents: [],
      });
    }

    // Auto-provision a Vendor entity if a Vendor signs up directly
    if (dto.role === 'Vendor') {
      const vendors = this.data.collection('vendors');
      const vendorExists = vendors.some((v) => v.userId === user.id || v.name.toLowerCase() === dto.name.toLowerCase());
      if (!vendorExists) {
        this.data.create('vendors', 'V', {
          userId: user.id,
          name: dto.name,
          businessName: dto.name,
          category: 'Event Services',
          status: 'Approved',
          rating: 5.0,
          created: new Date().toISOString().slice(0, 10),
        });
      }
    }

    return this.session(user);
  }

  private session(user: User) {
    const { passwordHash, ...safeUser } = user;
    const enrichedUser: any = { ...safeUser };

    if (user.role === 'Vendor') {
      const vendors = this.data.collection('vendors');
      const vendor = vendors.find((v) => v.userId === user.id || v.name.toLowerCase() === user.name.toLowerCase() || (user.email && user.email.toLowerCase().includes(v.name.toLowerCase().split(' ')[0])));
      if (vendor) {
        enrichedUser.vendorId = vendor.id;
        enrichedUser.vendorName = vendor.name;
        enrichedUser.businessName = vendor.businessName || vendor.name;
      } else {
        // Link default or generate
        enrichedUser.vendorId = `V_${user.id}`;
        enrichedUser.vendorName = user.name;
        enrichedUser.businessName = user.name;
      }
    } else if (user.role === 'Staff') {
      const staff = this.data.collection('staff').find((s) => s.userId === user.id || (s.email && s.email.toLowerCase() === user.email.toLowerCase()));
      if (staff) {
        enrichedUser.staffId = staff.id;
      }
    }

    return {
      user: enrichedUser,
      role: String(user.role).toLowerCase(),
      token: `session-${user.id}-${Date.now()}`,
    };
  }
}

