import { Injectable, NotFoundException } from '@nestjs/common';
import { AppData } from '../domain/models';
import { seedData } from './seed';

type CollectionName = {
  [K in keyof AppData]: AppData[K] extends Array<unknown> ? K : never
}[keyof AppData];

@Injectable()
export class DataService {
  private readonly data: AppData = structuredClone(seedData);

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

  getValue<K extends keyof AppData>(name: K): AppData[K] {
    return this.data[name];
  }

  setValue<K extends keyof AppData>(name: K, value: AppData[K]): AppData[K] {
    this.data[name] = value;
    return this.data[name];
  }

  nextId(list: Array<{ id: string }>, prefix: string): string {
    const max = list.reduce((acc, item) => {
      const numeric = Number(String(item.id).replace(/\D/g, ''));
      return Number.isFinite(numeric) ? Math.max(acc, numeric) : acc;
    }, 0);
    return `${prefix}${String(max + 1).padStart(3, '0')}`;
  }
}
