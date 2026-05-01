import { Injectable } from '@nestjs/common';
import { DecisionDto } from '../../common/dto/action.dto';
import { DataService } from '../../database/data.service';
import { CreateVendorApplicationDto, CreateVendorDto, UpdateVendorApplicationDto, UpdateVendorDto } from './dto';

@Injectable()
export class VendorsService {
  constructor(private readonly data: DataService) {}
  vendors() { return this.data.collection('vendors'); }
  findVendor(id: string) { return this.data.find('vendors', id); }
  createVendor(dto: CreateVendorDto) { return this.data.create('vendors', 'V', dto); }
  updateVendor(id: string, dto: UpdateVendorDto) { return this.data.update('vendors', id, dto); }
  removeVendor(id: string) { return this.data.remove('vendors', id); }

  applications() { return this.data.collection('vendorApplications'); }
  findApplication(id: string) { return this.data.find('vendorApplications', id); }
  createApplication(dto: CreateVendorApplicationDto) {
    const app = this.data.create('vendorApplications', 'VAPP', { status: 'pending', submittedAt: new Date().toISOString(), ...dto });
    this.data.setValue('vendorDocSubmission', app);
    return app;
  }
  updateApplication(id: string, dto: UpdateVendorApplicationDto) { return this.data.update('vendorApplications', id, dto); }
  decideApplication(id: string, dto: DecisionDto) {
    const app = this.data.update('vendorApplications', id, { status: dto.status, note: dto.note });
    if (dto.status === 'approved') {
      const exists = this.data.collection('vendors').some((vendor) => vendor.name === app.businessName);
      if (!exists) this.data.create('vendors', 'V', { name: app.businessName, status: 'Approved' });
    }
    return app;
  }
  removeApplication(id: string) { return this.data.remove('vendorApplications', id); }
}
