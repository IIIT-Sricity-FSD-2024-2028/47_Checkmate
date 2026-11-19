import { Injectable } from '@nestjs/common';
import { DataService } from '../../database/data.service';
import { CreatePackageDto, UpdatePackageDto } from './dto';
import { assertVendorOwns, stampOwnVendor } from '../../common/security/vendor-ownership';

type Caller = { id?: string; role?: string } | undefined;
const isVendor = (user: Caller) => String(user?.role || '').toLowerCase() === 'vendor';

@Injectable()
export class PackagesService {
  constructor(private readonly data: DataService) {}
  findAll() { return this.data.collection('packages'); }
  findOne(id: string) { return this.data.find('packages', id); }
  // A vendor's package is always theirs and always starts "pending" (only an
  // admin approves it on Service Moderation).
  async create(dto: CreatePackageDto, user?: Caller) {
    const row = await stampOwnVendor(this.data, user, dto);
    if (!row.status || isVendor(user)) row.status = 'pending';
    return this.data.create('packages', 'P', row);
  }
  // Vendors may edit only their own packages, and never the approval status
  async update(id: string, dto: UpdatePackageDto, user?: Caller) {
    await assertVendorOwns(this.data, user, await this.data.find('packages', id), 'package', dto.vendorId);
    if (isVendor(user) && dto.status !== undefined) delete (dto as any).status;
    return this.data.update('packages', id, dto);
  }
  decidePackage(id: string, decision: { status: 'pending' | 'approved' | 'rejected' }) {
    return this.data.update('packages', id, { status: decision.status });
  }
  async remove(id: string, user?: Caller) {
    await assertVendorOwns(this.data, user, await this.data.find('packages', id), 'package');
    return this.data.remove('packages', id);
  }
}
