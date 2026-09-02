/**
 * Financial & Commission Constants for EventPro Revenue Model
 * Single Source of Truth for Platform Commission (10%) and Vendor Payout (90%)
 */

export const DEFAULT_COMMISSION_RATE = 0.10; // 10% platform commission fee
export const VENDOR_SHARE_RATE = 0.90;       // 90% vendor net payout

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
