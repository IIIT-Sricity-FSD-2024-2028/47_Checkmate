/**
 * ============================================================================
 * CLIENT DATE RULES (utils/dateRules.js)
 * ============================================================================
 * The same two rules the backend enforces (back-end/src/modules/events/event-date-rules.ts):
 *   1. A new event (or a moved date) must be at least 7 days from today.
 *   2. A client can cancel only when the event is MORE than 3 days away;
 *      inside 3 days they have to contact the admin.
 * The frontend checks them first so the client gets the message straight away;
 * the backend checks again, so they cannot be skipped.
 * ============================================================================
 */

export const MIN_BOOKING_NOTICE_DAYS = 7;
export const CLIENT_CANCEL_CUTOFF_DAYS = 3;
// Same text as the backend (event-date-rules.ts)
export const CLIENT_CANCEL_BLOCKED_MESSAGE = "Cancellation is not allowed within 3 days of the event, contact admin.";
// Statuses a client may cancel themselves (backend: CLIENT_CANCELLABLE)
export const CLIENT_CANCELLABLE_STATUSES = ["pending", "waiting", "confirmed", "approved"];

// Today's date as YYYY-MM-DD in the browser's local time
export function todayString(now = new Date()) {
  return now.toLocaleDateString("en-CA"); // en-CA formats as YYYY-MM-DD
}

// today + n days as YYYY-MM-DD
export function addDays(date, days) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

// Whole calendar days from today until `date` (NaN when not a date)
export function daysUntil(date, today = todayString()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ""))) return NaN;
  const toDay = (value) => {
    const [y, m, d] = value.split("-").map(Number);
    return Date.UTC(y, m - 1, d) / 86400000;
  };
  return toDay(date) - toDay(today);
}

/** The earliest date a client may pick (today + 7). */
export function minBookingDate() {
  return addDays(todayString(), MIN_BOOKING_NOTICE_DAYS);
}

/** Error text for a date that breaks rule 1, or "" when it is fine. */
export function bookingDateError(date) {
  if (!date) return "";
  return date < minBookingDate()
    ? `Events must be booked at least ${MIN_BOOKING_NOTICE_DAYS} days in advance (earliest: ${minBookingDate()}).`
    : "";
}

/** Rule 2: true when the client may still cancel this event themselves. */
export function canClientCancel(date) {
  const days = daysUntil(date);
  return Number.isNaN(days) || days > CLIENT_CANCEL_CUTOFF_DAYS;
}
