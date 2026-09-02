import { Injectable, NotFoundException } from '@nestjs/common';
import { DataService } from '../../database/data.service';
import { CreateBookingDto, SettlePayoutDto, UpdateBookingDto } from './dto';
import { calculateCommissionSplit, DEFAULT_COMMISSION_RATE } from '../../common/constants/finance.constants';
import { Booking } from '../../domain/models';

@Injectable()
export class BookingsService {
  constructor(private readonly data: DataService) {}

  findAll() {
    return this.data.collection('bookings');
  }

  findOne(id: string) {
    return this.data.find('bookings', id);
  }

  create(dto: CreateBookingDto) {
    const cost = Number(dto.cost || 0);
    const rate = dto.commissionRate !== undefined ? Number(dto.commissionRate) : DEFAULT_COMMISSION_RATE;
    const split = calculateCommissionSplit(cost, rate);

    const payload: Partial<Booking> = {
      ...dto,
      cost,
      commissionRate: split.commissionRate,
      commissionAmount: dto.commissionAmount !== undefined ? Number(dto.commissionAmount) : split.commissionAmount,
      vendorPayoutAmount: dto.vendorPayoutAmount !== undefined ? Number(dto.vendorPayoutAmount) : split.vendorPayoutAmount,
      payoutStatus: (dto.payoutStatus as any) || 'pending',
      paymentStatus: (dto.paymentStatus as any) || 'unpaid',
      created: dto.created || new Date().toISOString().slice(0, 10),
    };

    return this.data.create('bookings', 'BK', payload as any);
  }

  update(id: string, dto: UpdateBookingDto) {
    const existing = this.data.find('bookings', id);
    const patch: Partial<Booking> = { ...dto } as any;

    if (dto.cost !== undefined || dto.commissionRate !== undefined) {
      const cost = dto.cost !== undefined ? Number(dto.cost) : existing.cost;
      const rate = dto.commissionRate !== undefined ? Number(dto.commissionRate) : (existing.commissionRate || DEFAULT_COMMISSION_RATE);
      const split = calculateCommissionSplit(cost, rate);

      patch.cost = cost;
      patch.commissionRate = split.commissionRate;
      patch.commissionAmount = split.commissionAmount;
      patch.vendorPayoutAmount = split.vendorPayoutAmount;
    }

    return this.data.update('bookings', id, patch as any);
  }

  remove(id: string) {
    return this.data.remove('bookings', id);
  }

  /**
   * Returns filtered commission and settlement records with financial summaries
   */
  findCommissions(query?: { vendorId?: string; payoutStatus?: string; eventId?: string }) {
    let bookings = this.data.collection('bookings') as Booking[];

    if (query?.vendorId) {
      const vId = query.vendorId.toLowerCase();
      bookings = bookings.filter((b) => (b.vendorId || '').toLowerCase() === vId || (b.vendor || '').toLowerCase() === vId);
    }
    if (query?.payoutStatus) {
      const pStatus = query.payoutStatus.toLowerCase();
      bookings = bookings.filter((b) => (b.payoutStatus || 'pending').toLowerCase() === pStatus);
    }
    if (query?.eventId) {
      const eId = query.eventId.toLowerCase();
      bookings = bookings.filter((b) => (b.eventId || '').toLowerCase() === eId);
    }

    const totalGross = bookings.reduce((sum, b) => sum + Number(b.cost || 0), 0);
    const totalCommission = bookings.reduce((sum, b) => sum + Number(b.commissionAmount || 0), 0);
    const totalVendorPayouts = bookings.reduce((sum, b) => sum + Number(b.vendorPayoutAmount || 0), 0);
    const pendingVendorPayouts = bookings
      .filter((b) => (b.payoutStatus || 'pending') === 'pending')
      .reduce((sum, b) => sum + Number(b.vendorPayoutAmount || 0), 0);
    const settledVendorPayouts = bookings
      .filter((b) => b.payoutStatus === 'settled')
      .reduce((sum, b) => sum + Number(b.vendorPayoutAmount || 0), 0);

    return {
      summary: {
        totalBookings: bookings.length,
        totalGrossVolume: totalGross,
        platformCommissionRate: DEFAULT_COMMISSION_RATE,
        platformCommissionEarned: totalCommission,
        totalVendorPayoutObligations: totalVendorPayouts,
        pendingVendorPayouts,
        settledVendorPayouts,
      },
      items: bookings,
    };
  }

  /**
   * Settles a pending payout to a vendor for a specific booking
   */
  settlePayout(id: string, dto?: SettlePayoutDto, adminUserId?: string) {
    const booking = this.data.find('bookings', id);
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found.`);
    }

    const settledAt = new Date().toISOString();
    const settledBy = dto?.settledBy || adminUserId || 'U001';

    const updated = this.data.update('bookings', id, {
      payoutStatus: 'settled',
      settledAt,
      settledBy,
    } as any);

    this.data.logActivity(
      'PAYOUT_SETTLED',
      'BOOKING',
      id,
      {
        bookingId: id,
        eventName: booking.eventName,
        vendor: booking.vendor,
        vendorId: booking.vendorId,
        cost: booking.cost,
        commissionAmount: booking.commissionAmount,
        vendorPayoutAmount: booking.vendorPayoutAmount,
        settledAt,
        settledBy,
        note: dto?.note,
      },
      settledBy,
      'Admin',
    );

    return updated;
  }
}
