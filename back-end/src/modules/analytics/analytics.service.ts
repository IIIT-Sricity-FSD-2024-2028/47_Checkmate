import { Injectable } from '@nestjs/common';
import { DataService } from '../../database/data.service';
import { DEFAULT_COMMISSION_RATE, VENDOR_SHARE_RATE } from '../../common/constants/finance.constants';

@Injectable()
export class AnalyticsService {
  constructor(private readonly data: DataService) {}

  summary() {
    const snapshot = this.data.snapshot();
    const confirmedStatuses = ['Confirmed', 'Completed', 'confirmed', 'completed', 'In Progress', 'live'];
    const totalRevenue = snapshot.bookings.reduce((sum, booking) => sum + Number(booking.cost || 0), 0);
    const confirmedRevenue = snapshot.bookings
      .filter((booking) => confirmedStatuses.includes(booking.status))
      .reduce((sum, booking) => sum + Number(booking.cost || 0), 0);
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

    const totalResources = snapshot.resources.reduce((sum, r) => sum + Number(r.total ?? r.quantity ?? 0), 0);
    const availableResources = snapshot.resources.reduce((sum, r) => sum + Number(r.avail ?? r.quantityAvailable ?? r.quantity ?? 0), 0);
    const resourceUtilizationRate = totalResources > 0 ? Number((((totalResources - availableResources) / totalResources) * 100).toFixed(2)) : 0;

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

  snapshot() {
    return this.data.snapshot();
  }

  stateKey(key: string) {
    return this.data.getValue(this.normalizeKey(key));
  }

  setStateKey(key: string, value: unknown) {
    return this.data.setValue(this.normalizeKey(key), value);
  }

  private normalizeKey(key: string): string {
    const aliases: Record<string, string> = {
      vendorApplicationsList: 'vendorApplications',
    };
    return aliases[key] || key;
  }
}
