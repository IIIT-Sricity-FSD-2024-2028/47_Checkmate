import { Injectable } from '@nestjs/common';
import { hashPassword } from '../../common/security/password';
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
    // Store the raw password separately so we can hash it on approval.
    // The passwordHash field here actually contains the raw password from the signup form.
    const rawPassword = dto.passwordHash;
    const appPayload = {
      status: 'pending' as const,
      submittedAt: new Date().toISOString(),
      ...dto,
      // Keep the raw password in passwordHash field for now; it will be hashed on approval
      passwordHash: rawPassword || '',
    };
    const app = this.data.create('vendorApplications', 'VAPP', appPayload);
    this.data.setValue('vendorDocSubmission', app);
    return app;
  }
  updateApplication(id: string, dto: UpdateVendorApplicationDto) { return this.data.update('vendorApplications', id, dto); }
  decideApplication(id: string, dto: DecisionDto) {
    // Hash the raw password stored in the application BEFORE updating status.
    // This ensures the DataService trigger (triggerVendorApplicationUpdated) uses the hashed value.
    const currentApp = this.data.find('vendorApplications', id);
    const rawPassword = currentApp.passwordHash || '';
    const hashedPassword = rawPassword && !rawPassword.startsWith('$2b$') && rawPassword.length < 128
      ? hashPassword(rawPassword)
      : rawPassword; // Already hashed or is a hash

    // Pre-set the hashed password on the application before the status change triggers auto-provisioning
    const app = this.data.update('vendorApplications', id, {
      status: dto.status,
      note: dto.note,
      decidedAt: new Date().toISOString(),
      passwordHash: hashedPassword,
    });

    // The DataService triggerVendorApplicationUpdated handles vendor + user creation,
    // but we need to ensure the user gets the properly hashed password.
    // Check if the trigger already created the user; if so, update the password hash.
    if (dto.status === 'approved') {
      const createdUser = this.data.collection('users').find((u) => u.email.toLowerCase() === app.email.toLowerCase());
      if (createdUser && createdUser.passwordHash !== hashedPassword) {
        this.data.update('users', createdUser.id, { passwordHash: hashedPassword });
      }
    }

    return app;
  }
  removeApplication(id: string) { return this.data.remove('vendorApplications', id); }
}
