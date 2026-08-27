import { Injectable } from '@nestjs/common';
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
    return this.sanitize(this.data.create('users', 'U', {
      ...user,
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
