import { Injectable, ForbiddenException } from '@nestjs/common';
import { DataService } from '../../database/data.service';
import { DEFAULT_COMMISSION_RATE, isCancelledBooking, VENDOR_SHARE_RATE } from '../../common/constants/finance.constants';

// The revenue model + dashboard KPIs. Everything here is derived live from the
// bookings/events/resources collections -- nothing is stored pre-computed.
@Injectable()
export class AnalyticsService {
  constructor(private readonly data: DataService) {}

  summary() {
    const snapshot = this.data.snapshot();
    // Refunded bookings are not revenue and not payouts owed.
    const bookings = snapshot.bookings.filter((booking) => !isCancelledBooking(booking));

    // Bookings are the billable records. One is created automatically whenever an
    // event flips to confirmed/approved (see DataService.triggerEventUpdated),
    // so revenue follows the event lifecycle without any manual bookkeeping.
    const confirmedStatuses = ['Confirmed', 'Completed', 'confirmed', 'completed', 'In Progress', 'live'];

    // Total = every booking. Confirmed = only the ones that actually count as earned.
    const totalRevenue = bookings.reduce((sum, booking) => sum + Number(booking.cost || 0), 0);
    const confirmedRevenue = bookings
      .filter((booking) => confirmedStatuses.includes(booking.status))
      .reduce((sum, booking) => sum + Number(booking.cost || 0), 0);
    // Whatever is booked but not yet in a confirmed state.
    const pendingRevenue = totalRevenue - confirmedRevenue;

    // Platform Commission (10%) and Vendor Payouts (90%)
    const platformCommissionEarned = bookings.reduce(
      (sum, b) => sum + Number(b.commissionAmount !== undefined ? b.commissionAmount : (b.cost || 0) * DEFAULT_COMMISSION_RATE),
      0,
    );
    const confirmedCommissionEarned = bookings
      .filter((b) => confirmedStatuses.includes(b.status))
      .reduce(
        (sum, b) => sum + Number(b.commissionAmount !== undefined ? b.commissionAmount : (b.cost || 0) * DEFAULT_COMMISSION_RATE),
        0,
      );

    const totalVendorPayouts = bookings.reduce(
      (sum, b) => sum + Number(b.vendorPayoutAmount !== undefined ? b.vendorPayoutAmount : (b.cost || 0) * VENDOR_SHARE_RATE),
      0,
    );
    const pendingVendorPayouts = bookings
      .filter((b) => (b.payoutStatus || 'pending') === 'pending')
      .reduce(
        (sum, b) => sum + Number(b.vendorPayoutAmount !== undefined ? b.vendorPayoutAmount : (b.cost || 0) * VENDOR_SHARE_RATE),
        0,
      );
    const settledVendorPayouts = bookings
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
    const commissionPct = this.data.getCommissionRate() * 100;
    const platformCommission = Number(((confirmedRevenue * commissionPct) / 100).toFixed(2));
    // What vendors are owed once the platform takes its share.
    const vendorPayout = Number((confirmedRevenue - platformCommission).toFixed(2));

    return {
      users: snapshot.users.length,
      vendors: snapshot.vendors.length,
      events: snapshot.events.length,
      liveEvents: snapshot.events.filter((e) => e.status === 'live').length,
      completedEvents: snapshot.events.filter((e) => e.status === 'completed').length,
      bookings: bookings.length,
      resources: snapshot.resources.length,
      staff: snapshot.staff.length,
      openIssues: snapshot.issues.filter((issue) => issue.status !== 'closed' && issue.status !== 'resolved').length,
      // ── Financial Metrics ──
      grossBookingVolume: totalRevenue,
      totalRevenue,
      confirmedRevenue,
      pendingRevenue,
      commissionRate: this.data.getCommissionRate(),
      platformCommissionEarned,
      confirmedCommissionEarned,
      totalVendorPayouts,
      pendingVendorPayouts,
      settledVendorPayouts,
      averageBookingValue: bookings.length > 0 ? Number((totalRevenue / bookings.length).toFixed(2)) : 0,
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
    this.assertNotPrivate(key);
    const name = this.normalizeKey(key);
    return this.scrubCollection(name, this.data.getValue(name));
  }

  // Only the loosely-structured keys may be written here. Real collections
  // (users, events, bookings...) have their own endpoints with their own rules;
  // without this list any signed-in user could overwrite e.g. the users list.
  private static readonly SHARED_KEYS = [
    'adminChatMessages', 'coordinationMessages', 'notifications', 'monitorProgress',
    'resourceAllocations', 'contingencyPlans', 'staffRequests', 'staffTasks',
    'venueAllocations', 'liveEvents', 'session', 'vendorNotifications',
  ];
  // Admin-only keys. platformSettings is still written here by the legacy admin
  // page; the React app uses the validated PUT /settings instead.
  private static readonly ADMIN_KEYS = ['superuserEngineSettings', 'platformSettings', 'recruitments'];

  setStateKey(key: string, value: unknown, role?: string) {
    this.assertNotPrivate(key);
    const name = this.normalizeKey(key);
    const isAdmin = role === 'admin' || role === 'superuser';
    const allowed = AnalyticsService.SHARED_KEYS.includes(name) || (isAdmin && AnalyticsService.ADMIN_KEYS.includes(name));
    if (!allowed) {
      throw new ForbiddenException(`"${name}" can't be changed through /state. Use its own endpoint.`);
    }
    return this.data.setValue(name, value);
  }

  // These have their own routes with ownership checks.
  private assertNotPrivate(key: string) {
    if (['staffApplications', 'messages'].includes(key)) {
      throw new ForbiddenException('This data is not available here.');
    }
  }

  // The frontend asks for one key under an older name; map it to the real one.
  private normalizeKey(key: string): string {
    const aliases: Record<string, string> = {
      vendorApplicationsList: 'vendorApplications',
    };
    return aliases[key] || key;
  }

  // Collections that carry credentials: `users` and `vendorApplications` both hold
  // a password hash, so neither may ever leave the server as-is.
  private static readonly SECRET_FIELDS = ['passwordHash', 'password'];

  private stripCredentials(snapshot: any) {
    return {
      ...snapshot,
      users: (snapshot.users || []).map((row: any) => this.omitSecrets(row)),
      vendorApplications: (snapshot.vendorApplications || []).map((row: any) => this.omitSecrets(row)),
      vendorDocSubmission: this.omitSecrets(snapshot.vendorDocSubmission),
      staffApplications: [],
      messages: {},
    };
  }

  // stateKey can address any collection by name, including the two above.
  private scrubCollection(name: string, value: unknown) {
    if ((name === 'users' || name === 'vendorApplications') && Array.isArray(value)) {
      return value.map((row) => this.omitSecrets(row));
    }
    if (name === 'vendorDocSubmission') return this.omitSecrets(value as any);
    return value;
  }

  private omitSecrets<T extends Record<string, any>>(row: T) {
    if (!row || typeof row !== 'object') return row;
    const clean: Record<string, any> = { ...row };
    AnalyticsService.SECRET_FIELDS.forEach((field) => delete clean[field]);
    return clean;
  }
}
