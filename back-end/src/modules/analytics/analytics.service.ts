import { Injectable } from '@nestjs/common';
import { DataService } from '../../database/data.service';

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
      totalRevenue,
      confirmedRevenue,
      pendingRevenue,
      averageBookingValue: snapshot.bookings.length > 0 ? Number((totalRevenue / snapshot.bookings.length).toFixed(2)) : 0,
      resourceUtilizationRate,
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
