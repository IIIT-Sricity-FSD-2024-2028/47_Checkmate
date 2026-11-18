/**
 * ============================================================================
 * EVENT TIME WINDOWS (utils/eventWindow.js)
 * ============================================================================
 * Same rule as the backend (back-end/src/modules/resources/resource-availability.ts):
 *   an event runs from date + time to (endDate or date) + endTime.
 *   - end time earlier than start on a one-day event = runs past midnight
 *   - no end time = assume the whole last day
 * Two events clash only when these windows overlap, so work on another day
 * (or later the same evening) never makes someone "busy".
 * ============================================================================
 */

const MINUTES_PER_DAY = 24 * 60;

// "6:30 PM" or "18:30" -> minutes after midnight; null if unreadable
function toMinutes(time) {
  const match = String(time || "").trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (!match) return null;
  let hours = Number(match[1]);
  if (match[3] === "pm" && hours < 12) hours += 12;
  if (match[3] === "am" && hours === 12) hours = 0;
  return hours * 60 + Number(match[2] || 0);
}

// Minutes since 1970 at midnight of a YYYY-MM-DD date (UTC, so time zones can't shift it)
function dayStart(date) {
  const [y, m, d] = String(date).split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 60000;
}

/** [start, end) of an event in minutes, or null when it has no valid date. */
export function eventRange(event) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(event?.date || ""))) return null;
  const lastDay = event.endDate && event.endDate >= event.date ? event.endDate : event.date;
  const start = toMinutes(event.time || event.startTime) ?? 0;
  let end = toMinutes(event.endTime);
  if (end === null) end = MINUTES_PER_DAY;
  else if (lastDay === event.date && end <= start) end += MINUTES_PER_DAY;
  return { start: dayStart(event.date) + start, end: dayStart(lastDay) + end };
}

/** True when the two events' time windows overlap (unknown dates count as overlapping). */
export function eventsOverlap(a, b) {
  const first = eventRange(a);
  const second = eventRange(b);
  if (!first || !second) return true;
  return first.start < second.end && second.start < first.end;
}
