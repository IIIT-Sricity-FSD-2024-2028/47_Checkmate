import { Injectable, NotFoundException } from '@nestjs/common';
import { AppData } from '../domain/models';
import { seedData } from './seed';

type CollectionName = {
  [K in keyof AppData]: AppData[K] extends Array<unknown> ? K : never
}[keyof AppData];

@Injectable()
export class DataService {
  private readonly data: AppData = structuredClone(seedData);

  constructor() {
    // Auto-create staff records for seed users with role 'Staff'
    const avatars = ['pink', 'teal', 'purple', 'green', 'orange'];
    const staffUsers = this.data.users.filter(
      (u) => u.role === 'Staff' && !this.data.staff.some((s) => s.email?.toLowerCase() === u.email.toLowerCase()),
    );
    staffUsers.forEach((u) => {
      const initials = u.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
      (this.data.staff as Array<any>).push({
        id: this.nextId(this.data.staff as Array<{ id: string }>, 'S'),
        name: u.name,
        initials,
        role: 'Staff Member',
        phone: u.phone || '',
        email: u.email,
        workload: 0,
        status: 'available',
        avail: 'Available',
        events: 0,
        avatar: avatars[this.data.staff.length % avatars.length],
        assignedEvents: [],
      });
    });
  }

  snapshot(): AppData {
    return structuredClone(this.data);
  }

  collection<K extends CollectionName>(name: K): AppData[K] {
    return this.data[name];
  }

  find<K extends CollectionName>(name: K, id: string): AppData[K][number] {
    const row = (this.data[name] as Array<{ id: string }>).find((item) => item.id === id);
    if (!row) throw new NotFoundException(`${String(name)} item ${id} was not found.`);
    return row as AppData[K][number];
  }

  create<K extends CollectionName>(name: K, prefix: string, payload: Omit<AppData[K][number], 'id'> & { id?: string }): AppData[K][number] {
    const list = this.data[name] as Array<{ id: string }>;
    const item = { ...payload, id: payload.id || this.nextId(list, prefix) };
    list.push(item);
    return structuredClone(item) as AppData[K][number];
  }

  update<K extends CollectionName>(name: K, id: string, patch: Partial<AppData[K][number]>): AppData[K][number] {
    const list = this.data[name] as Array<{ id: string }>;
    const index = list.findIndex((item) => item.id === id);
    if (index < 0) throw new NotFoundException(`${String(name)} item ${id} was not found.`);
    list[index] = { ...list[index], ...patch };
    return structuredClone(list[index]) as AppData[K][number];
  }

  remove<K extends CollectionName>(name: K, id: string): { id: string; deleted: true } {
    const list = this.data[name] as Array<{ id: string }>;
    const index = list.findIndex((item) => item.id === id);
    if (index < 0) throw new NotFoundException(`${String(name)} item ${id} was not found.`);
    list.splice(index, 1);
    return { id, deleted: true };
  }

  getValue(name: string): unknown {
    return (this.data as any)[name];
  }

  setValue(name: string, value: unknown): unknown {
    (this.data as any)[name] = value;
    return (this.data as any)[name];
  }

  nextId(list: Array<{ id: string }>, prefix: string): string {
    const max = list.reduce((acc, item) => {
      const numeric = Number(String(item.id).replace(/\D/g, ''));
      return Number.isFinite(numeric) ? Math.max(acc, numeric) : acc;
    }, 0);
    return `${prefix}${String(max + 1).padStart(3, '0')}`;
  }
}
