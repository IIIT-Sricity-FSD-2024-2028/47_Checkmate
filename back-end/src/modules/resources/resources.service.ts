import { Injectable } from '@nestjs/common';
import { DataService } from '../../database/data.service';
import { CreateResourceDto, UpdateResourceDto } from './dto';

@Injectable()
export class ResourcesService {
  constructor(private readonly data: DataService) {}
  findAll() { return this.data.collection('resources'); }
  findOne(id: string) { return this.data.find('resources', id); }
  create(dto: CreateResourceDto) { return this.data.create('resources', 'R', { unit: 'day', ...dto }); }
  update(id: string, dto: UpdateResourceDto) { return this.data.update('resources', id, dto); }
  remove(id: string) { return this.data.remove('resources', id); }
}
