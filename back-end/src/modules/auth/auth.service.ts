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
    const exists = this.data.collection('users').some((row) => row.email.toLowerCase() === dto.email.toLowerCase());
    if (exists) throw new BadRequestException('An account with this email already exists.');

    const user = this.data.create('users', 'U', {
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      role: dto.role,
      status: 'Active',
      created: new Date().toISOString().slice(0, 10),
      passwordHash: hashPassword(dto.password),
    });
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
