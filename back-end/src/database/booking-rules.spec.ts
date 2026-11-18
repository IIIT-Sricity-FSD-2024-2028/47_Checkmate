/**
 * Unit tests for booking-rules.ts: a booking follows its event, and a cancelled
 * or rejected event keeps only the admin's cancellation fee.
 */
import { bookingStatusForEvent, cancelBooking, reinstateBooking, syncBookingWithEvent } from './booking-rules';
import { cancellationFeeFromPercent } from '../common/constants/finance.constants';

// A confirmed ₹10,000 booking at 10% commission
const booking = (extra: any = {}) => ({
  id: 'BK1', eventId: 'EVT1', eventName: 'Gala', client: 'Emily', vendor: 'Elite', status: 'Confirmed',
  cost: 10000, advancePaid: 0, paymentStatus: 'unpaid', commissionRate: 0.1, commissionAmount: 1000,
  vendorPayoutAmount: 9000, payoutStatus: 'pending', created: '2027-01-01', ...extra,
}) as any;

describe('booking status follows the event', () => {
  it('maps event statuses to booking statuses', () => {
    expect(bookingStatusForEvent('live')).toBe('In Progress');
    expect(bookingStatusForEvent('completed')).toBe('Completed');
    expect(bookingStatusForEvent('rejected')).toBe('Cancelled');
    expect(bookingStatusForEvent('pending')).toBeNull();
  });
  it('changes nothing when already in step', () => {
    expect(syncBookingWithEvent(booking(), 'confirmed', 0)).toEqual({});
  });
  it('marks a completed event\'s booking Completed without touching the money', () => {
    expect(syncBookingWithEvent(booking(), 'completed', 0)).toEqual({ status: 'Completed' });
  });
});

describe('cancellation fee', () => {
  it('reads the admin percentage, 0 when missing or invalid', () => {
    expect(cancellationFeeFromPercent(20)).toBe(0.2);
    expect(cancellationFeeFromPercent(undefined)).toBe(0);
    expect(cancellationFeeFromPercent('abc')).toBe(0);
    expect(cancellationFeeFromPercent(150)).toBe(0);
  });
  it('with no fee, a cancelled booking earns nobody anything', () => {
    const patch = cancelBooking(booking(), 0);
    expect(patch).toMatchObject({ status: 'Cancelled', cost: 0, commissionAmount: 0, vendorPayoutAmount: 0, originalCost: 10000, paymentStatus: 'not_due', payoutStatus: 'not_due' });
  });
  it('with a 20% fee, commission and payout come out of the fee', () => {
    const patch = cancelBooking(booking(), 0.2);
    expect(patch).toMatchObject({ cost: 2000, commissionAmount: 200, vendorPayoutAmount: 1800, paymentStatus: 'unpaid', payoutStatus: 'pending' });
  });
  it('refunds what the client paid above the fee', () => {
    const patch = cancelBooking(booking({ advancePaid: 10000, paymentStatus: 'paid' }), 0.2);
    expect(patch).toMatchObject({ cost: 2000, advancePaid: 2000, refundAmount: 8000, paymentStatus: 'paid' });
    expect(cancelBooking(booking({ advancePaid: 10000, paymentStatus: 'paid' }), 0)).toMatchObject({ refundAmount: 10000, paymentStatus: 'refunded' });
  });
  it('does not change money on a payout that was already released', () => {
    expect(cancelBooking(booking({ payoutStatus: 'settled' }), 0)).toEqual({ status: 'Cancelled', cancelledAt: expect.any(String) });
  });
  it('confirming the event again brings the full price back', () => {
    const cancelled = { ...booking(), ...cancelBooking(booking(), 0.2) };
    expect(reinstateBooking(cancelled)).toMatchObject({ status: 'Confirmed', cost: 10000, commissionAmount: 1000, vendorPayoutAmount: 9000, payoutStatus: 'pending' });
  });
});
