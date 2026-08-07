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

    // Auto-create a staff record so the vendor Manage Staff page sees them
    if (dto.role === 'Staff') {
      const initials = dto.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
      const avatars = ['pink', 'teal', 'purple', 'green', 'orange'];
      const staffList = this.data.collection('staff');
      this.data.create('staff', 'S', {
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

    return this.session(user);
  }

  private session(user: User) {
    const { passwordHash, ...safeUser } = user;
    return {
      user: safeUser,
      role: String(user.role).toLowerCase(),
      token: `session-${user.id}-${Date.now()}`,
    };
  }
}
