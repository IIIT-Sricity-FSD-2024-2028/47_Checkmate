import { Injectable, ForbiddenException } from '@nestjs/common';
import { hashPassword } from '../../common/security/password';
import { DecisionDto } from '../../common/dto/action.dto';
import { DataService } from '../../database/data.service';
import { CreateVendorApplicationDto, CreateVendorDto, UpdateVendorApplicationDto, UpdateVendorDto } from './dto';
import { DEFAULT_COMMISSION_RATE, VENDOR_SHARE_RATE } from '../../common/constants/finance.constants';

// Two related things live here: the approved `vendors` list, and the
// `vendorApplications` queue that admins approve or reject.
//
// WATCH OUT: between signup and approval, the application's `passwordHash`
// field holds the RAW password, not a hash. It is only hashed at the moment
// of approval (decideApplication), just before the account is created.
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
    // The signup form sends the raw password in `passwordHash`. It is hashed
    // straight away (it used to sit in database.json as plain text until an admin
    // decided), and `passwordHashed` tells decideApplication not to hash it twice.
    // The status is always "pending": an applicant cannot approve themselves.
    const rawPassword = dto.passwordHash;
    const appPayload = {
      submittedAt: new Date().toISOString(),
      ...dto,
      status: 'pending' as const,
      passwordHash: rawPassword ? hashPassword(rawPassword) : '',
      passwordHashed: true,
    };
    const app = this.data.create('vendorApplications', 'VAPP', appPayload);
    this.data.setValue('vendorDocSubmission', app);
    return app;
  }
  updateApplication(id: string, dto: UpdateVendorApplicationDto) { return this.data.update('vendorApplications', id, dto); }
  // `user` is the admin/superuser deciding; a rejection keeps the reason so the
  // applicant is shown it when they try to sign in (AuthService.login).
  decideApplication(id: string, dto: DecisionDto, user?: { id?: string; name?: string; role?: string }) {
    // Hash the raw password stored in the application BEFORE updating status.
    // This ensures the DataService trigger (triggerVendorApplicationUpdated) uses the hashed value.
    const currentApp = this.data.find('vendorApplications', id);
    const rawPassword = currentApp.passwordHash || '';
    // Only hash if it still looks like plain text -- guards against hashing twice
    // if an application is approved, reopened, and approved again.
    const hashedPassword = (currentApp as any).passwordHashed || !rawPassword
      ? rawPassword // hashed when the application was submitted
      : hashPassword(rawPassword); // older applications still hold the raw text

    // Pre-set the hashed password on the application before the status change triggers auto-provisioning
    const app = this.data.update('vendorApplications', id, {
      status: dto.status,
      note: dto.note,
      rejectionReason: dto.status === 'rejected' ? dto.note || 'No reason given' : undefined,
      decidedBy: user?.name ? `${user.name} (${String(user.role || '').toLowerCase()})` : undefined,
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

  /**
   * Retrieves financial earnings, platform commission deductions, and payout history for a vendor
   */
  // A vendor may only read their own earnings (admins/superusers: anyone's)
  getVendorPayouts(vendorId: string, user?: { id?: string; role?: string }) {
    if (String(user?.role || '').toLowerCase() === 'vendor') {
      const own = this.data.collection('vendors').find((v: any) => v.userId === user?.id);
      if (!own || own.id.toLowerCase() !== vendorId.toLowerCase()) {
        throw new ForbiddenException("You can only view your own payouts.");
      }
    }
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
      if (!share) return b;
      // A cancelled booking keeps only the fee, so each vendor's share shrinks by the same ratio
      const ratio = b.originalCost ? Number(b.cost || 0) / b.originalCost : 1;
      const scaled = (n: number) => Number((Number(n || 0) * ratio).toFixed(2));
      return { ...b, ...share, cost: scaled(share.cost), commissionAmount: scaled(share.commissionAmount), vendorPayoutAmount: scaled(share.vendorPayoutAmount), vendorSplits: undefined };
    });

    const totalEarnedGross = vendorBookings.reduce((sum, b) => sum + Number(b.cost || 0), 0);
    const platformFeeDeducted = vendorBookings.reduce((sum, b) => sum + Number(b.commissionAmount !== undefined ? b.commissionAmount : (b.cost || 0) * DEFAULT_COMMISSION_RATE), 0);
    const netPayoutAmount = vendorBookings.reduce((sum, b) => sum + Number(b.vendorPayoutAmount !== undefined ? b.vendorPayoutAmount : (b.cost || 0) * VENDOR_SHARE_RATE), 0);
    const pendingPayouts = vendorBookings
      .filter((b) => (b.payoutStatus || 'pending') === 'pending')
      .reduce((sum, b) => sum + Number(b.vendorPayoutAmount !== undefined ? b.vendorPayoutAmount : (b.cost || 0) * VENDOR_SHARE_RATE), 0);
    const settledPayouts = vendorBookings
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
