import { Injectable } from '@nestjs/common';
import { DataService } from '../../database/data.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly data: DataService) {}
  summary() {
    const snapshot = this.data.snapshot();
    const confirmedStatuses = ['Confirmed', 'Completed', 'confirmed', 'completed'];
    const totalRevenue = snapshot.bookings.reduce((sum, booking) => sum + booking.cost, 0);
    const confirmedRevenue = snapshot.bookings.filter((booking) => confirmedStatuses.includes(booking.status)).reduce((sum, booking) => sum + booking.cost, 0);
    return {
      users: snapshot.users.length,
      vendors: snapshot.vendors.length,
      events: snapshot.events.length,
      bookings: snapshot.bookings.length,
      resources: snapshot.resources.length,
      staff: snapshot.staff.length,
      openIssues: snapshot.issues.filter((issue) => issue.status !== 'closed').length,
      totalRevenue,
      confirmedRevenue,
    };
  }
  snapshot() { return this.data.snapshot(); }
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
