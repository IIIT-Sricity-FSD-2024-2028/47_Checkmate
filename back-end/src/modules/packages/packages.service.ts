import { Injectable } from '@nestjs/common';
import { DataService } from '../../database/data.service';
import { CreatePackageDto, UpdatePackageDto } from './dto';

@Injectable()
export class PackagesService {
  constructor(private readonly data: DataService) {}
  findAll() { return this.data.collection('packages'); }
  findOne(id: string) { return this.data.find('packages', id); }
  create(dto: CreatePackageDto) {
    if (!dto.status) dto.status = 'pending';
    return this.data.create('packages', 'P', dto);
  }
  update(id: string, dto: UpdatePackageDto) { return this.data.update('packages', id, dto); }
  decidePackage(id: string, decision: { status: 'pending' | 'approved' | 'rejected' }) {
    return this.data.update('packages', id, { status: decision.status });
  }
  remove(id: string) { return this.data.remove('packages', id); }
}
