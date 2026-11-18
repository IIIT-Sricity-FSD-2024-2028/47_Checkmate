/**
 * EVENT DATE RULES (pure functions, tested in event-date-rules.spec.ts)
 *
 *   1. A client can only request an event at least 7 days from today
 *      (vendors / admins / superusers may still create closer events).
 *   2. A client can only cancel an event that is MORE than 3 days away.
 *      Inside 3 days they must contact the admin.
 *
 * Days are counted on calendar dates (YYYY-MM-DD), so the time of day the
 * request is made never changes the answer.
 */
import { BadRequestException } from '@nestjs/common';

export const MIN_BOOKING_NOTICE_DAYS = 7;
export const CLIENT_CANCEL_CUTOFF_DAYS = 3;

/** Today's date as YYYY-MM-DD in the server's local time. */
export function todayString(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Whole calendar days from `today` to `date` (negative = in the past); NaN if not a date. */
export function daysUntil(date: string, today = todayString()): number {
  const toDay = (value: string) => {
    const [y, m, d] = String(value).split('-').map(Number);
    return Date.UTC(y, (m || 1) - 1, d || 1) / 86400000;
  };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) return NaN;
  return toDay(date) - toDay(today);
}

/** today + n days as YYYY-MM-DD (used in the error message). */
export function addDays(today: string, days: number): string {
  const [y, m, d] = today.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Rule 1 — throws 400 unless `date` is at least 7 days from today. */
export function assertBookingNotice(date: string, today = todayString()) {
  const days = daysUntil(date, today);
  if (Number.isNaN(days)) throw new BadRequestException('Please choose a valid event date.');
  if (days < MIN_BOOKING_NOTICE_DAYS) {
    throw new BadRequestException(
      `Events must be booked at least ${MIN_BOOKING_NOTICE_DAYS} days in advance. The earliest date you can choose is ${addDays(today, MIN_BOOKING_NOTICE_DAYS)}.`,
    );
  }
}

/** Rule 2 — throws 400 unless the event is more than 3 days away. */
export function assertClientCanCancel(date: string, today = todayString()) {
  const days = daysUntil(date, today);
  if (!Number.isNaN(days) && days <= CLIENT_CANCEL_CUTOFF_DAYS) {
    const when = days < 0 ? 'has already started' : days === 0 ? 'is today' : `is only ${days} day${days === 1 ? '' : 's'} away`;
    throw new BadRequestException(
      `This event ${when}. Events can only be cancelled more than ${CLIENT_CANCEL_CUTOFF_DAYS} days in advance — please contact the admin to cancel it.`,
    );
  }
}
