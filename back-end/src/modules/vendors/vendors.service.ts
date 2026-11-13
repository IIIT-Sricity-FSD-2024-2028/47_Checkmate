import { Injectable } from '@nestjs/common';
import { hashPassword } from '../../common/security/password';
import { DecisionDto } from '../../common/dto/action.dto';
import { DataService } from '../../database/data.service';
import { CreateVendorApplicationDto, CreateVendorDto, UpdateVendorApplicationDto, UpdateVendorDto } from './dto';
import { DEFAULT_COMMISSION_RATE, isCancelledBooking, VENDOR_SHARE_RATE } from '../../common/constants/finance.constants';

// Two related things live here: the approved `vendors` list, and the
// `vendorApplications` queue that admins approve or reject.
//
// The applicant's password is hashed the moment the application arrives, and
// applications are never sent back with it (see sanitize). On approval the
// DataService trigger copies that hash onto the new vendor's user account.
const SHA256_HEX = /^[a-f0-9]{64}$/;

@Injectable()
export class VendorsService {
  constructor(private readonly data: DataService) {}
  vendors() { return this.data.collection('vendors'); }
  findVendor(id: string) { return this.data.find('vendors', id); }
  createVendor(dto: CreateVendorDto) { return this.data.create('vendors', 'V', dto); }
  updateVendor(id: string, dto: UpdateVendorDto) { return this.data.update('vendors', id, dto); }
  removeVendor(id: string) { return this.data.remove('vendors', id); }
  applications() { return this.data.collection('vendorApplications').map((app) => this.sanitize(app)); }
  findApplication(id: string) { return this.sanitize(this.data.find('vendorApplications', id)); }
  createApplication(dto: CreateVendorApplicationDto) {
    // The signup form sends the plain password in `passwordHash`; hash it before storing.
    // status goes after ...dto so an applicant can't submit themselves as "approved".
    const app = this.data.create('vendorApplications', 'VAPP', {
      submittedAt: new Date().toISOString(),
      ...dto,
      status: 'pending' as const,
      passwordHash: dto.passwordHash ? hashPassword(dto.passwordHash) : '',
    });
    this.data.setValue('vendorDocSubmission', this.sanitize(app));

    // Global Settings > Auto-Approve Vendors skips the admin review.
    const settings = this.data.getValue('platformSettings') as { autoApproveVendors?: boolean } | undefined;
    if (settings?.autoApproveVendors) {
      return this.decideApplication(app.id, { status: 'approved', note: 'Auto-approved (Global Settings)' });
    }
    return this.sanitize(app);
  }
  updateApplication(id: string, dto: UpdateVendorApplicationDto) {
    return this.sanitize(this.data.update('vendorApplications', id, dto));
  }
  decideApplication(id: string, dto: DecisionDto) {
    // Applications saved before passwords were hashed on arrival may still hold
    // plain text; hash those now so the new account can log in.
    const current = this.data.find('vendorApplications', id);
    const stored = current.passwordHash || '';
    const passwordHash = stored && !SHA256_HEX.test(stored) ? hashPassword(stored) : stored;

    // Approving fires the DataService trigger that creates the vendor + user.
    const app = this.data.update('vendorApplications', id, {
      status: dto.status,
      note: dto.note,
      decidedAt: new Date().toISOString(),
      passwordHash,
    });
    return this.sanitize(app);
  }
  private sanitize<T extends { passwordHash?: string }>(app: T) {
    const { passwordHash, ...safe } = app;
    return safe;
  }
  removeApplication(id: string) { return this.data.remove('vendorApplications', id); }

  /**
   * Retrieves financial earnings, platform commission deductions, and payout history for a vendor
   */
  getVendorPayouts(vendorId: string) {
    const vendor = this.findVendor(vendorId);
    const allBookings = this.data.collection('bookings');
    const vendorBookings = allBookings.filter(
      (b) =>
        b.vendorSplits?.some((s) => s.vendorId.toLowerCase() === vendorId.toLowerCase()) ||
        (b.vendorId && b.vendorId.toLowerCase() === vendorId.toLowerCase()) ||
        (b.vendor && vendor && (b.vendor.toLowerCase() === vendor.name.toLowerCase() || b.vendor.toLowerCase() === (vendor.businessName || '').toLowerCase())),
    ).map((b) => {
      // On a shared booking, this vendor only earns their part
      const share = b.vendorSplits?.find((s) => s.vendorId.toLowerCase() === vendorId.toLowerCase());
      return share ? { ...b, ...share, vendorSplits: undefined } : b;
    });

    // Refunded bookings stay in the list but earn nothing.
    const counted = vendorBookings.filter((b) => !isCancelledBooking(b));
    const totalEarnedGross = counted.reduce((sum, b) => sum + Number(b.cost || 0), 0);
    const platformFeeDeducted = counted.reduce((sum, b) => sum + Number(b.commissionAmount !== undefined ? b.commissionAmount : (b.cost || 0) * DEFAULT_COMMISSION_RATE), 0);
    const netPayoutAmount = counted.reduce((sum, b) => sum + Number(b.vendorPayoutAmount !== undefined ? b.vendorPayoutAmount : (b.cost || 0) * VENDOR_SHARE_RATE), 0);
    const pendingPayouts = counted
      .filter((b) => (b.payoutStatus || 'pending') === 'pending')
      .reduce((sum, b) => sum + Number(b.vendorPayoutAmount !== undefined ? b.vendorPayoutAmount : (b.cost || 0) * VENDOR_SHARE_RATE), 0);
    const settledPayouts = counted
      .filter((b) => b.payoutStatus === 'settled')
      .reduce((sum, b) => sum + Number(b.vendorPayoutAmount !== undefined ? b.vendorPayoutAmount : (b.cost || 0) * VENDOR_SHARE_RATE), 0);

    return {
      vendorId: vendor.id,
      vendorName: vendor.name,
      businessName: vendor.businessName,
      commissionRate: this.data.getCommissionRate(),
      totalEarnedGross,
      platformFeeDeducted,
      netPayoutAmount,
      pendingPayouts,
      settledPayouts,
      completedEventsCount: vendorBookings.filter((b) => String(b.status).toLowerCase() === 'completed').length,
      bookings: vendorBookings,
    };
  }
}
