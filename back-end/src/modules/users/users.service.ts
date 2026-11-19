import { BadRequestException, Injectable } from '@nestjs/common';
import { hashPassword } from '../../common/security/password';
import { DataService } from '../../database/data.service';
import { CreateUserDto, PROFILE_FIELDS, UpdateProfileDto, UpdateUserDto } from './dto';

@Injectable()
export class UsersService {
  constructor(private readonly data: DataService) {}
  async findAll() { return (await this.data.collection('users')).map((user) => this.sanitize(user)); }
  async findOne(id: string) { return this.sanitize((await this.data.find('users', id))); }
  async create(dto: CreateUserDto) {
    const { password, ...user } = dto;
    const cleanEmail = String(user.email || '').trim().toLowerCase();
    const existingUser = (await this.data.collection('users')).find((u) => u.email.toLowerCase() === cleanEmail);
    if (existingUser) {
      throw new BadRequestException('A user with this email already exists.');
    }

    if (user.phone && String(user.phone).trim()) {
      const cleanDigits = String(user.phone).replace(/\D/g, '');
      if (cleanDigits.length >= 7) {
        const matchingUsers = (await this.data.collection('users')).filter((row) => {
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

    return this.sanitize((await this.data.create('users', 'U', {
      ...user,
      email: cleanEmail,
      passwordHash: hashPassword(password || 'ChangeMe@2026'),
    })));
  }
  async update(id: string, dto: UpdateUserDto) {
    const { password, ...patch } = dto;
    return this.sanitize((await this.data.update('users', id, {
      ...patch,
      ...(password ? { passwordHash: hashPassword(password) } : {}),
    })));
  }
  
  async getProfile(email: string) {
    if (!email) return null;
    const user = (await this.data.collection('users')).find(u => u.email.toLowerCase() === email.toLowerCase());
    return user ? this.sanitize(user) : null;
  }

  // Updates the signed-in user's own profile. Only PROFILE_FIELDS are copied,
  // so even a request that slipped past validation can never change role,
  // status, email or password here.
  async updateProfile(email: string, dto: UpdateProfileDto) {
    const user = (await this.data.collection('users')).find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return null;
    const patch: Record<string, unknown> = {};
    PROFILE_FIELDS.forEach((field) => {
      if ((dto as any)[field] !== undefined) patch[field] = (dto as any)[field];
    });

    // The Profile pages always send the email. A changed email must not belong
    // to another account, otherwise two users would share one login.
    const newEmail = String(dto.email || '').trim().toLowerCase();
    if (newEmail && newEmail !== user.email.toLowerCase()) {
      const taken = (await this.data.collection('users')).some((u) => u.id !== user.id && u.email.toLowerCase() === newEmail);
      if (taken) throw new BadRequestException('This email is already used by another account.');
      patch.email = newEmail;
    }
    return this.sanitize((await this.data.update('users', user.id, patch as any)));
  }

  async updateAvatar(email: string, avatarUrl: string) {
    const user = (await this.data.collection('users')).find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return null;
    return this.sanitize((await this.data.update('users', user.id, { profile_picture_url: avatarUrl })));
  }

  async remove(id: string) { return (await this.data.remove('users', id)); }
  private sanitize<T extends { passwordHash?: string }>(user: T) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
