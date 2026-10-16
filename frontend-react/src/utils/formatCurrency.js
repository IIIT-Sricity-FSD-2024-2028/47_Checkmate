/**
 * "$45,000" from a number or numeric string. Non-numbers become "$0".
 */
export function formatCurrency(value) {
  const amount = Number(value);
  return `$${(Number.isFinite(amount) ? amount : 0).toLocaleString()}`;
}
