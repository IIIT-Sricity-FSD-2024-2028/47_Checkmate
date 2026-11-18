import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DataService } from '../../database/data.service';
import { CreateBookingDto, SettlePayoutDto, UpdateBookingDto } from './dto';
import { calculateCommissionSplit } from '../../common/constants/finance.constants';
import { Booking } from '../../domain/models';

type Caller = { id?: string; role?: string } | undefined;

@Injectable()
export class BookingsService {
  constructor(private readonly data: DataService) {}

  // Who may see a booking: admins/superusers all; a client their own; a vendor
  // the ones they supplied (directly or as one of several vendors).
  private vendorIdOf(user?: Caller) {
    return this.data.collection('vendors').find((v: any) => v.userId === user?.id)?.id;
  }

  private canSee(booking: Booking, user?: Caller) {
    const role = String(user?.role || '').toLowerCase();
    if (!user || ['admin', 'superuser'].includes(role)) return true;
    if (role === 'client') return booking.clientId === user.id;
    if (role === 'vendor') {
      const vendorId = this.vendorIdOf(user);
      return Boolean(vendorId) && (booking.vendorId === vendorId || (booking.vendorSplits || []).some((s) => s.vendorId === vendorId));
    }
    return false;
  }

  findAll(user?: Caller) {
    return this.data.collection('bookings').filter((b) => this.canSee(b as Booking, user));
  }

  findOne(id: string, user?: Caller) {
    const booking = this.data.find('bookings', id) as Booking;
    if (!this.canSee(booking, user)) throw new ForbiddenException('You can only view your own bookings.');
    return booking;
  }

  create(dto: CreateBookingDto) {
    const cost = Number(dto.cost || 0);
    const rate = dto.commissionRate !== undefined ? Number(dto.commissionRate) : this.data.getCommissionRate();
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
    if (dto.payoutStatus === 'settled' && existing.payoutStatus !== 'settled') {
      throw new BadRequestException('Payouts can only be released through the settlement action.');
    }
    const patch: Partial<Booking> = { ...dto } as any;

    if (dto.cost !== undefined || dto.commissionRate !== undefined) {
      const cost = dto.cost !== undefined ? Number(dto.cost) : existing.cost;
      const rate = dto.commissionRate !== undefined ? Number(dto.commissionRate) : (existing.commissionRate ?? this.data.getCommissionRate());
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
  // A vendor always gets only their own ledger, whatever vendorId they ask for.
  findCommissions(query?: { vendorId?: string; payoutStatus?: string; eventId?: string }, user?: Caller) {
    let bookings = (this.data.collection('bookings') as Booking[]).filter((b) => this.canSee(b, user));

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
        platformCommissionRate: this.data.getCommissionRate(),
        platformCommissionEarned: totalCommission,
        totalVendorPayoutObligations: totalVendorPayouts,
        pendingVendorPayouts,
        settledVendorPayouts,
      },
      items: bookings.map((b) => ({ ...b, settleBlockReason: this.getSettleBlockReason(b) })),
    };
  }

  /**
   * Why a booking's payout cannot be released yet, or null when it can. The vendor
   * is paid only after the client has paid in full and the event has finished.
   */
  // A cancelled booking with a cancellation fee can also be paid out (the vendor's
  // share of the fee) once the client has paid that fee.
  private getSettleBlockReason(booking: Booking): string | null {
    if (booking.payoutStatus === 'settled') return 'Payout already settled';
    if (Number(booking.vendorPayoutAmount || 0) <= 0) return 'Nothing to pay out';
    if (booking.paymentStatus !== 'paid') return 'Client has not paid in full';
    if (booking.status === 'Cancelled') return null;
    const event = this.data.collection('events').find((e) => e.id === booking.eventId);
    if (String(event?.status ?? booking.status).toLowerCase() !== 'completed') return 'Event is not completed';
    return null;
  }

  /**
   * Records that the client who owns a booking has paid its full amount
   */
  recordPayment(id: string, user?: { id: string }) {
    const booking = this.data.find('bookings', id);
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found.`);
    }
    if (!booking.clientId || booking.clientId !== user?.id) {
      throw new ForbiddenException('You can only pay your own bookings.');
    }
    if (booking.paymentStatus === 'paid') {
      throw new BadRequestException('This booking is already paid.');
    }
    if (Number(booking.cost || 0) <= 0) {
      throw new BadRequestException('Nothing is due on this booking.');
    }

    const updated = this.data.update('bookings', id, { advancePaid: booking.cost, paymentStatus: 'paid' } as any);
    this.data.logActivity('PAYMENT_RECORDED', 'BOOKING', id, { bookingId: id, eventName: booking.eventName, amount: booking.cost }, user.id, 'Client');
    return updated;
  }

  /**
   * Settles a pending payout to a vendor for a specific booking
   */
  settlePayout(id: string, dto?: SettlePayoutDto, adminUserId?: string) {
    const booking = this.data.find('bookings', id);
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found.`);
    }

    const blockReason = this.getSettleBlockReason(booking);
    if (blockReason) {
      throw new BadRequestException(`Cannot release payout: ${blockReason}.`);
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
