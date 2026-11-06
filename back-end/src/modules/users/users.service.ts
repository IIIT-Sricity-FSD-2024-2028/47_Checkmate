import { BadRequestException, Injectable } from '@nestjs/common';
import { hashPassword } from '../../common/security/password';
import { DataService } from '../../database/data.service';
import { CreateUserDto, UpdateUserDto } from './dto';

@Injectable()
export class UsersService {
  constructor(private readonly data: DataService) {}
  findAll() { return this.data.collection('users').map((user) => this.sanitize(user)); }
  findOne(id: string) { return this.sanitize(this.data.find('users', id)); }
  create(dto: CreateUserDto) {
    const { password, ...user } = dto;
    const cleanEmail = String(user.email || '').trim().toLowerCase();
    const existingUser = this.data.collection('users').find((u) => u.email.toLowerCase() === cleanEmail);
    if (existingUser) {
      throw new BadRequestException('A user with this email already exists.');
    }

    if (user.phone && String(user.phone).trim()) {
      const cleanDigits = String(user.phone).replace(/\D/g, '');
      if (cleanDigits.length >= 7) {
        const matchingUsers = this.data.collection('users').filter((row) => {
          const rowDigits = String(row.phone || '').replace(/\D/g, '');
          if (!rowDigits) return false;
          return (
            rowDigits === cleanDigits ||
            (cleanDigits.length >= 10 && rowDigits.endsWith(cleanDigits.slice(-10))) ||
            (rowDigits.length >= 10 && cleanDigits.endsWith(rowDigits.slice(-10)))
          );
        });
        if (matchingUsers.length >= 2) {
          throw new BadRequestException('A maximum of 2 accounts can be registered with the same phone number.');
        }
      }
    }

    return this.sanitize(this.data.create('users', 'U', {
      ...user,
      email: cleanEmail,
      passwordHash: hashPassword(password || 'ChangeMe@2026'),
    }));
  }
  update(id: string, dto: UpdateUserDto) {
    const { password, ...patch } = dto;
    return this.sanitize(this.data.update('users', id, {
      ...patch,
      ...(password ? { passwordHash: hashPassword(password) } : {}),
    }));
  }
  
  getProfile(email: string) {
    if (!email) return null;
    const user = this.data.collection('users').find(u => u.email.toLowerCase() === email.toLowerCase());
    return user ? this.sanitize(user) : null;
  }

  updateProfile(email: string, dto: { 
    name?: string;
    bio?: string; 
    phone?: string;
    location?: string;
    address?: string;
    date_of_birth?: string;
    years_experience?: number;
    skills?: string;
    website_url?: string;
    linkedin_url?: string;
  }) {
    const user = this.data.collection('users').find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return null;
    return this.sanitize(this.data.update('users', user.id, dto));
  }

  updateAvatar(email: string, avatarUrl: string) {
    const user = this.data.collection('users').find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return null;
    return this.sanitize(this.data.update('users', user.id, { profile_picture_url: avatarUrl }));
  }

  remove(id: string) { return this.data.remove('users', id); }
  private sanitize<T extends { passwordHash?: string }>(user: T) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
