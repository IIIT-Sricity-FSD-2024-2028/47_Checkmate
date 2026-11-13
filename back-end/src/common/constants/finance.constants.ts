/**
 * Financial & Commission Constants for EventPro Revenue Model
 * The live rate is set on Global Settings; 10% only applies if that is missing.
 */

export const DEFAULT_COMMISSION_RATE = 0.10; // 10% platform commission fee
export const VENDOR_SHARE_RATE = 0.90;       // 90% vendor net payout

/** Converts the Global Settings percentage into a rate (12 -> 0.12). */
export function commissionRateFromPercent(percent: unknown): number {
  if (percent === undefined || percent === null || percent === '') return DEFAULT_COMMISSION_RATE;
  const value = Number(percent);
  return Number.isFinite(value) && value >= 0 && value <= 100 ? value / 100 : DEFAULT_COMMISSION_RATE;
}

/** A booking whose event was refunded. It no longer counts as revenue or as a payout owed. */
export function isCancelledBooking(booking: { status?: string; payoutStatus?: string }): boolean {
  return String(booking.status).toLowerCase() === 'cancelled' || booking.payoutStatus === 'cancelled';
}

export interface CommissionCalculation {
  totalCost: number;
  commissionRate: number;
  commissionAmount: number;
  vendorPayoutAmount: number;
}

/**
 * Calculates the exact 10% platform commission and 90% vendor payout split.
 * Uses exact 2-decimal rounding to prevent floating point inaccuracies.
 *
 * @param totalCost Total gross event / booking cost
 * @param rate Commission rate (defaults to 0.10 / 10%)
 */
export function calculateCommissionSplit(
  totalCost: number,
  rate: number = DEFAULT_COMMISSION_RATE,
): CommissionCalculation {
  const safeCost = Math.max(0, Number(totalCost) || 0);
  const commissionAmount = Number((safeCost * rate).toFixed(2));
  const vendorPayoutAmount = Number((safeCost - commissionAmount).toFixed(2));

  return {
    totalCost: safeCost,
    commissionRate: rate,
    commissionAmount,
    vendorPayoutAmount,
  };
}
