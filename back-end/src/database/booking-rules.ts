/**
 * BOOKING RULES — how a booking follows its event (pure functions, no database).
 *
 * A booking is created when the vendor approves an event (DataService
 * triggerEventUpdated). After that the booking must mirror the event:
 *   event live       -> booking "In Progress"
 *   event completed  -> booking "Completed"   (payout can now be released)
 *   event cancelled / rejected -> booking "Cancelled"; the client owes only the
 *     cancellation fee set by the admin on Global Settings (0% = nothing at all),
 *     and commission + vendor payout are taken from that fee.
 *   event confirmed again after a cancel -> the original price comes back.
 * Kept separate from DataService so the rules can be unit-tested on their own
 * (see booking-rules.spec.ts).
 */
import { Booking } from '../domain/models';
import { calculateCommissionSplit, DEFAULT_COMMISSION_RATE } from '../common/constants/finance.constants';

// Rounds to paise so money never shows 0.30000000000000004
const round2 = (value: number) => Number(Number(value || 0).toFixed(2));

/** The booking status that matches an event status, or null when there is no change to make. */
export function bookingStatusForEvent(eventStatus: string): string | null {
  const status = String(eventStatus || '').toLowerCase();
  if (status === 'confirmed' || status === 'approved') return 'Confirmed';
  if (status === 'live') return 'In Progress';
  if (status === 'completed') return 'Completed';
  if (status === 'cancelled' || status === 'rejected') return 'Cancelled';
  return null; // pending / waiting: the booking is left as it is
}

/** Payment status from how much the client paid against what they owe. */
function paymentStatusFor(amountDue: number, paid: number, refund: number): Booking['paymentStatus'] {
  if (amountDue <= 0) return refund > 0 ? 'refunded' : 'not_due';
  if (paid >= amountDue) return 'paid';
  return paid > 0 ? 'partially_paid' : 'unpaid';
}

/**
 * The changes to make when a booking's event is cancelled or rejected.
 * feeRate is a fraction (0.2 = 20% of the original price is kept).
 * Money already paid above the fee is recorded as a refund (simulated, like payments).
 */
export function cancelBooking(booking: Booking, feeRate: number, now = new Date().toISOString()): Partial<Booking> {
  // A payout already released cannot be clawed back here; only the status changes
  if (booking.payoutStatus === 'settled') return { status: 'Cancelled', cancelledAt: now };

  const originalCost = booking.originalCost ?? Number(booking.cost || 0);
  const fee = round2(originalCost * feeRate);
  const paid = Number(booking.advancePaid || 0);
  const refund = round2(Math.max(0, paid - fee));
  const split = calculateCommissionSplit(fee, booking.commissionRate ?? DEFAULT_COMMISSION_RATE);

  return {
    status: 'Cancelled',
    originalCost,
    cancellationFeeRate: feeRate,
    cost: fee,
    commissionAmount: split.commissionAmount,
    vendorPayoutAmount: split.vendorPayoutAmount,
    advancePaid: Math.min(paid, fee),
    refundAmount: refund,
    paymentStatus: paymentStatusFor(fee, Math.min(paid, fee), refund),
    payoutStatus: fee > 0 ? 'pending' : 'not_due',
    cancelledAt: now,
  };
}

/** The changes to make when a cancelled booking's event is confirmed again: the full price returns. */
export function reinstateBooking(booking: Booking): Partial<Booking> {
  const cost = Number(booking.originalCost ?? booking.cost ?? 0);
  const paid = Number(booking.advancePaid || 0);
  const split = calculateCommissionSplit(cost, booking.commissionRate ?? DEFAULT_COMMISSION_RATE);
  return {
    status: 'Confirmed',
    cost,
    commissionAmount: split.commissionAmount,
    vendorPayoutAmount: split.vendorPayoutAmount,
    paymentStatus: paymentStatusFor(cost, paid, 0),
    payoutStatus: 'pending',
    cancellationFeeRate: undefined,
    refundAmount: undefined,
    cancelledAt: undefined,
  };
}

/**
 * Everything to change on a booking so it matches its event's status
 * (empty object = already in step).
 */
export function syncBookingWithEvent(booking: Booking, eventStatus: string, feeRate: number): Partial<Booking> {
  const target = bookingStatusForEvent(eventStatus);
  if (!target || target === booking.status) return {};
  if (target === 'Cancelled') return cancelBooking(booking, feeRate);
  if (booking.status === 'Cancelled') return { ...reinstateBooking(booking), status: target };
  return { status: target };
}
