/**
 * ============================================================================
 * DATE-BASED RESOURCE AVAILABILITY (resource-availability.ts)
 * ============================================================================
 * Purpose:
 *   Answers one question: "how many units of resource X are free for the
 *   time window of the event being booked?"
 *
 *   Before this file, a unit allocated to ANY unfinished event was treated as
 *   gone, whatever the date. Now a unit only counts as taken when the event
 *   holding it overlaps the requested window.
 *
 * Rules:
 *   1. Only events whose window overlaps the requested window count.
 *      - A window runs from `date` (+ `time`) to `endDate` (+ `endTime`).
 *      - No `endDate` means a one-day event.
 *      - No `time` means from the start of the day; no `endTime` means to the
 *        end of the last day (we cannot prove the stock is back earlier).
 *      - An `endTime` earlier than `time` on a one-day event crosses midnight.
 *      - Windows that only touch (one ends at 13:00, the next starts at 13:00)
 *        do NOT overlap.
 *   2. Only events that really hold stock count: rejected, cancelled,
 *      declined and completed events are ignored, and so are allocation rows
 *      already marked released/returned.
 *   3. The event being edited (excludeEventId) is ignored, so re-saving an
 *      event never blocks itself.
 *   4. available = usable stock - units held on overlapping events.
 *      Stock in Maintenance or Damaged condition is never usable.
 *
 * Everything here is a pure function (no Nest, no file access), so it is easy
 * to unit test. ResourcesService wraps it with the real data.
 * ============================================================================
 */

// Events in these states no longer hold any stock
export const NON_HOLDING_EVENT_STATUSES = ['rejected', 'cancelled', 'canceled', 'declined', 'completed'];

// Allocation rows in these states were handed back
const RELEASED_ITEM_STATUSES = ['released', 'returned'];

const MINUTES_PER_DAY = 24 * 60;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** The time span an event occupies. Only `date` is required. */
export interface BookingWindow {
  date: string;
  endDate?: string;
  time?: string;
  endTime?: string;
}

/** The minimum shape of the records this file reads. */
export interface AvailabilityResource {
  id: string;
  name: string;
  quantity?: number;
  total?: number;
  conditionStatus?: string;
}
export interface AvailabilityEvent {
  id: string;
  status?: string;
  date?: string;
  endDate?: string;
  time?: string;
  startTime?: string;
  endTime?: string;
}
export interface AvailabilityAllocationItem {
  resourceId: string;
  quantity?: number;
  qty?: number;
  status?: string;
}
export interface AvailabilityData {
  resources: AvailabilityResource[];
  events: AvailabilityEvent[];
  resourceAllocations: Record<string, AvailabilityAllocationItem[]>;
}

/** What getAvailability returns for one resource. */
export interface AvailabilityResult {
  resourceId: string;
  name: string;
  total: number;
  allocated: number;
  available: number;
  date: string;
  endDate: string;
}

// Turns "6:30 PM", "18:30" or "9" into minutes after midnight; null if unreadable
export function parseMinutes(time?: string): number | null {
  const match = String(time || '').trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2] || 0);
  if (match[3] === 'pm' && hours < 12) hours += 12;
  if (match[3] === 'am' && hours === 12) hours = 0;
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

// True when the text is a real calendar date written as YYYY-MM-DD
export function isValidDate(value?: string): boolean {
  if (!value || !DATE_PATTERN.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(y, m - 1, d));
  return parsed.getUTCFullYear() === y && parsed.getUTCMonth() === m - 1 && parsed.getUTCDate() === d;
}

// Minutes since 1970-01-01 at midnight of a YYYY-MM-DD date (UTC, so the
// server's time zone can never shift a date by one day)
function dayStartMinutes(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / 60000;
}

/**
 * Converts a window into [start, end) in minutes. Returns null when the date
 * is missing or not a real date.
 */
export function windowRange(window: BookingWindow): { start: number; end: number } | null {
  if (!isValidDate(window.date)) return null;
  const lastDay = isValidDate(window.endDate) && String(window.endDate) >= window.date ? String(window.endDate) : window.date;

  const startMinutes = parseMinutes(window.time) ?? 0;
  let endMinutes = parseMinutes(window.endTime);
  if (endMinutes === null) {
    endMinutes = MINUTES_PER_DAY; // No end time: assume the whole last day
  } else if (lastDay === window.date && endMinutes <= startMinutes) {
    endMinutes += MINUTES_PER_DAY; // e.g. 20:00 -> 02:00 runs past midnight
  }

  return {
    start: dayStartMinutes(window.date) + startMinutes,
    end: dayStartMinutes(lastDay) + endMinutes,
  };
}

// Two half-open ranges overlap when each one starts before the other ends
export function windowsOverlap(a: BookingWindow, b: BookingWindow): boolean {
  const first = windowRange(a);
  const second = windowRange(b);
  // An event with no usable date cannot be placed on the calendar, so we
  // cannot prove it is elsewhere: treat it as overlapping (safe side).
  if (!first || !second) return true;
  return first.start < second.end && second.start < first.end;
}

// The window an existing event occupies (events store the start as `time` or `startTime`)
export function eventWindow(event: AvailabilityEvent): BookingWindow {
  return {
    date: String(event.date || ''),
    endDate: event.endDate,
    time: event.time || event.startTime,
    endTime: event.endTime,
  };
}

// False for events that gave their stock back (rejected, cancelled, ...)
export function eventHoldsStock(event: AvailabilityEvent): boolean {
  return !NON_HOLDING_EVENT_STATUSES.includes(String(event.status || '').toLowerCase());
}

// Units on one allocation row that are still out (0 if it was released)
export function heldQuantity(item: AvailabilityAllocationItem): number {
  if (RELEASED_ITEM_STATUSES.includes(String(item.status || '').toLowerCase())) return 0;
  return Math.max(0, Number(item.quantity ?? item.qty ?? 0) || 0);
}

// Units of a resource that can ever be booked: total stock, or 0 if it is broken
export function usableStock(resource: AvailabilityResource): number {
  if (resource.conditionStatus === 'Maintenance' || resource.conditionStatus === 'Damaged') return 0;
  return Math.max(0, Number(resource.total ?? resource.quantity ?? 0) || 0);
}

/**
 * Full availability report for one resource in a window.
 * Returns null when the resource does not exist.
 */
export function getAvailability(
  data: AvailabilityData,
  resourceId: string,
  window: BookingWindow,
  excludeEventId?: string,
): AvailabilityResult | null {
  const resource = data.resources.find((r) => String(r.id).toLowerCase() === String(resourceId).toLowerCase());
  if (!resource) return null;

  const total = usableStock(resource);
  let allocated = 0;

  data.events.forEach((event) => {
    if (excludeEventId && String(event.id).toLowerCase() === String(excludeEventId).toLowerCase()) return;
    if (!eventHoldsStock(event)) return;
    if (!windowsOverlap(eventWindow(event), window)) return;

    (data.resourceAllocations[event.id] || []).forEach((item) => {
      if (String(item.resourceId).toLowerCase() === String(resource.id).toLowerCase()) {
        allocated += heldQuantity(item);
      }
    });
  });

  return {
    resourceId: resource.id,
    name: resource.name,
    total,
    allocated,
    available: Math.max(0, total - allocated),
    date: window.date,
    endDate: window.endDate && window.endDate >= window.date ? window.endDate : window.date,
  };
}

/**
 * The one number most callers need: units free for this window.
 * A missing resource has 0 free units.
 */
export function getAvailableQuantity(
  data: AvailabilityData,
  resourceId: string,
  window: BookingWindow | string,
  excludeEventId?: string,
): number {
  const target = typeof window === 'string' ? { date: window } : window;
  return getAvailability(data, resourceId, target, excludeEventId)?.available ?? 0;
}

// "2026-04-15" or "2026-04-15 to 2026-04-17"
export function describeWindow(window: BookingWindow): string {
  const last = window.endDate && window.endDate > window.date ? window.endDate : '';
  return last ? `${window.date} to ${last}` : window.date;
}

/**
 * Checks a list of requested units against what is free in the window.
 * Several rows for the same resource are added together first.
 * Returns one readable message per problem; an empty array means it all fits.
 */
export function findOverAllocations(
  data: AvailabilityData,
  items: Array<{ resourceId: string; resourceName?: string; quantity?: number; qty?: number; status?: string }>,
  window: BookingWindow,
  excludeEventId?: string,
): string[] {
  // Add up what is being asked for, per resource
  const wanted = new Map<string, { name?: string; quantity: number }>();
  items.forEach((item) => {
    if (!item?.resourceId) return;
    const key = String(item.resourceId);
    const entry = wanted.get(key) || { name: item.resourceName, quantity: 0 };
    entry.quantity += heldQuantity(item);
    wanted.set(key, entry);
  });

  const problems: string[] = [];
  wanted.forEach((entry, resourceId) => {
    if (entry.quantity <= 0) return;
    const result = getAvailability(data, resourceId, window, excludeEventId);
    if (!result) {
      problems.push(`Resource ${resourceId}${entry.name ? ` (${entry.name})` : ''} does not exist.`);
      return;
    }
    if (entry.quantity > result.available) {
      problems.push(
        `Only ${result.available} of ${result.total} ${result.name} are free on ${describeWindow(window)} (requested ${entry.quantity}).`,
      );
    }
  });
  return problems;
}
