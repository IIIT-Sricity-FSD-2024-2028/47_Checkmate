import { Injectable } from '@nestjs/common';
import { DataService } from '../../database/data.service';
import { DEFAULT_COMMISSION_RATE, VENDOR_SHARE_RATE } from '../../common/constants/finance.constants';

// The revenue model + dashboard KPIs. Everything here is derived live from the
// bookings/events/resources collections -- nothing is stored pre-computed.
@Injectable()
export class AnalyticsService {
  constructor(private readonly data: DataService) {}

  summary() {
    const snapshot = this.data.snapshot();

    // Bookings are the billable records. One is created automatically whenever an
    // event flips to confirmed/approved (see DataService.triggerEventUpdated),
    // so revenue follows the event lifecycle without any manual bookkeeping.
    const confirmedStatuses = ['Confirmed', 'Completed', 'confirmed', 'completed', 'In Progress', 'live'];

    // Total = every booking. Confirmed = only the ones that actually count as earned.
    const totalRevenue = snapshot.bookings.reduce((sum, booking) => sum + Number(booking.cost || 0), 0);
    const confirmedRevenue = snapshot.bookings
      .filter((booking) => confirmedStatuses.includes(booking.status))
      .reduce((sum, booking) => sum + Number(booking.cost || 0), 0);
    // Whatever is booked but not yet in a confirmed state.
    const pendingRevenue = totalRevenue - confirmedRevenue;

    // Platform Commission (10%) and Vendor Payouts (90%)
    const platformCommissionEarned = snapshot.bookings.reduce(
      (sum, b) => sum + Number(b.commissionAmount !== undefined ? b.commissionAmount : (b.cost || 0) * DEFAULT_COMMISSION_RATE),
      0,
    );
    const confirmedCommissionEarned = snapshot.bookings
      .filter((b) => confirmedStatuses.includes(b.status))
      .reduce(
        (sum, b) => sum + Number(b.commissionAmount !== undefined ? b.commissionAmount : (b.cost || 0) * DEFAULT_COMMISSION_RATE),
        0,
      );

    const totalVendorPayouts = snapshot.bookings.reduce(
      (sum, b) => sum + Number(b.vendorPayoutAmount !== undefined ? b.vendorPayoutAmount : (b.cost || 0) * VENDOR_SHARE_RATE),
      0,
    );
    const pendingVendorPayouts = snapshot.bookings
      .filter((b) => (b.payoutStatus || 'pending') === 'pending')
      .reduce(
        (sum, b) => sum + Number(b.vendorPayoutAmount !== undefined ? b.vendorPayoutAmount : (b.cost || 0) * VENDOR_SHARE_RATE),
        0,
      );
    const settledVendorPayouts = snapshot.bookings
      .filter((b) => b.payoutStatus === 'settled')
      .reduce(
        (sum, b) => sum + Number(b.vendorPayoutAmount !== undefined ? b.vendorPayoutAmount : (b.cost || 0) * VENDOR_SHARE_RATE),
        0,
      );

    // Resource utilisation = what share of stock is currently checked out.
    const totalResources = snapshot.resources.reduce((sum, r) => sum + Number(r.total ?? r.quantity ?? 0), 0);
    const availableResources = snapshot.resources.reduce((sum, r) => sum + Number(r.avail ?? r.quantityAvailable ?? r.quantity ?? 0), 0);
    const resourceUtilizationRate = totalResources > 0 ? Number((((totalResources - availableResources) / totalResources) * 100).toFixed(2)) : 0;

    // The platform's cut, driven by the rate an admin sets on the Global Settings
    // page. Stored under the generic state store, so fall back to 10% if unset.
    const settings: any = (snapshot as any).platformSettings || {};
    const commissionPct = Number.isFinite(Number(settings.commissionPct)) ? Number(settings.commissionPct) : 10;
    const platformCommission = Number(((confirmedRevenue * commissionPct) / 100).toFixed(2));
    // What vendors are owed once the platform takes its share.
    const vendorPayout = Number((confirmedRevenue - platformCommission).toFixed(2));

    return {
      users: snapshot.users.length,
      vendors: snapshot.vendors.length,
      events: snapshot.events.length,
      liveEvents: snapshot.events.filter((e) => e.status === 'live').length,
      completedEvents: snapshot.events.filter((e) => e.status === 'completed').length,
      bookings: snapshot.bookings.length,
      resources: snapshot.resources.length,
      staff: snapshot.staff.length,
      openIssues: snapshot.issues.filter((issue) => issue.status !== 'closed' && issue.status !== 'resolved').length,
      // ── Financial Metrics ──
      grossBookingVolume: totalRevenue,
      totalRevenue,
      confirmedRevenue,
      pendingRevenue,
      commissionRate: DEFAULT_COMMISSION_RATE,
      platformCommissionEarned,
      confirmedCommissionEarned,
      totalVendorPayouts,
      pendingVendorPayouts,
      settledVendorPayouts,
      averageBookingValue: snapshot.bookings.length > 0 ? Number((totalRevenue / snapshot.bookings.length).toFixed(2)) : 0,
      resourceUtilizationRate,
      commissionPct,
      platformCommission,
      vendorPayout,
    };
  }

  financialSummary() {
    const sum = this.summary();
    return {
      grossBookingVolume: sum.grossBookingVolume,
      platformCommissionRate: sum.commissionRate,
      platformCommissionEarned: sum.platformCommissionEarned,
      confirmedCommissionEarned: sum.confirmedCommissionEarned,
      totalVendorPayoutObligations: sum.totalVendorPayouts,
      pendingVendorPayouts: sum.pendingVendorPayouts,
      settledVendorPayouts: sum.settledVendorPayouts,
      averageBookingValue: sum.averageBookingValue,
      totalBookings: sum.bookings,
    };
  }

  // The whole database in one response. The frontend DB layer (vendor_js/data.js)
  // calls this once on page load and caches it, instead of hitting 10 endpoints.
  // Credentials are stripped first -- this response goes to every signed-in role.
  snapshot() {
    return this.stripCredentials(this.data.snapshot());
  }

  // Generic key/value read+write, used for the loosely-structured collections
  // (chat threads, progress bars, allocations) that have no dedicated module.
  stateKey(key: string) {
    const name = this.normalizeKey(key);
    return this.scrubCollection(name, this.data.getValue(name));
  }

  setStateKey(key: string, value: unknown) {
    return this.data.setValue(this.normalizeKey(key), value);
  }

  // The frontend asks for one key under an older name; map it to the real one.
  private normalizeKey(key: string): string {
    const aliases: Record<string, string> = {
      vendorApplicationsList: 'vendorApplications',
    };
    return aliases[key] || key;
  }

  // Collections that carry credentials. `users` holds the password hash, and a
  // vendorApplication holds the applicant's password in PLAIN TEXT until an admin
  // approves it (see VendorsService), so neither may ever leave the server as-is.
  private static readonly SECRET_FIELDS = ['passwordHash', 'password'];

  private stripCredentials(snapshot: any) {
    return {
      ...snapshot,
      users: (snapshot.users || []).map((row: any) => this.omitSecrets(row)),
      vendorApplications: (snapshot.vendorApplications || []).map((row: any) => this.omitSecrets(row)),
    };
  }

  // stateKey can address any collection by name, including the two above.
  private scrubCollection(name: string, value: unknown) {
    if ((name === 'users' || name === 'vendorApplications') && Array.isArray(value)) {
      return value.map((row) => this.omitSecrets(row));
    }
    return value;
  }

  private omitSecrets<T extends Record<string, any>>(row: T) {
    if (!row || typeof row !== 'object') return row;
    const clean: Record<string, any> = { ...row };
    AnalyticsService.SECRET_FIELDS.forEach((field) => delete clean[field]);
    return clean;
  }
}
