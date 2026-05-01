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
  remove(id: string) { return this.data.remove('users', id); }
  private sanitize<T extends { passwordHash?: string }>(user: T) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
