/**
 * STAFF PROFILE RULES (pure functions, no database) — used by StaffService and
 * tested in staff-profile.spec.ts.
 *
 *   eventsCompleted  = events this person actually worked (assignment not
 *                      declined) whose event status is "completed"
 *   rating           = average of the vendor ratings (1-5 stars), one decimal;
 *                      null while there are none
 *   isNew            = no completed events yet -> the UI shows a "New" badge and
 *                      NO rating
 *   busyOn           = the event this person is already working on during the
 *                      given date/time window (null = free). Date-based: work on
 *                      another day never makes someone "Unavailable".
 */
import { BookingWindow, eventWindow, windowsOverlap } from '../resources/resource-availability';

// Assignments that were turned down never count as work done or as "busy"
export const DECLINED_ASSIGNMENTS = ['rejected', 'declined'];
// Assignments that no longer hold the person (event over, or turned down)
export const CLOSED_ASSIGNMENTS = ['rejected', 'declined', 'completed'];
// Events that no longer need their staff
export const FINISHED_EVENTS = ['rejected', 'completed', 'cancelled'];

const lower = (value: unknown) => String(value || '').toLowerCase();

type Assignment = { staffId: string; eventId: string; eventName?: string; status?: string };
type EventLike = { id: string; name?: string; status?: string; date?: string; endDate?: string; time?: string; endTime?: string };
type Rating = { staffId: string; eventId: string; stars: number; comment?: string; ratedByName?: string; createdAt?: string };

/** Ids of the completed events this staff member worked on (declined ones excluded). */
export function completedEventIds(staffId: string, assignments: Assignment[], events: EventLike[]): string[] {
  const ids = new Set<string>();
  assignments
    .filter((a) => a.staffId === staffId && !DECLINED_ASSIGNMENTS.includes(lower(a.status)))
    .forEach((a) => {
      const event = events.find((e) => e.id === a.eventId);
      if (event && lower(event.status) === 'completed') ids.add(event.id);
    });
  return [...ids];
}

/** Average stars (1 decimal) and how many ratings; average is null with no ratings. */
export function ratingSummary(staffId: string, ratings: Rating[]) {
  const mine = ratings.filter((r) => r.staffId === staffId);
  if (!mine.length) return { rating: null as number | null, ratingCount: 0 };
  const average = mine.reduce((sum, r) => sum + Number(r.stars || 0), 0) / mine.length;
  return { rating: Math.round(average * 10) / 10, ratingCount: mine.length };
}

/**
 * The unfinished event this person is already assigned to during `window`,
 * or null. `excludeEventId` skips the event being planned (re-saving it must
 * not clash with itself).
 */
export function busyEventFor(
  staffId: string,
  window: BookingWindow,
  assignments: Assignment[],
  events: EventLike[],
  excludeEventId?: string,
): EventLike | null {
  for (const a of assignments) {
    if (a.staffId !== staffId || a.eventId === excludeEventId) continue;
    if (CLOSED_ASSIGNMENTS.includes(lower(a.status))) continue;
    const event = events.find((e) => e.id === a.eventId);
    if (!event || FINISHED_EVENTS.includes(lower(event.status))) continue;
    if (windowsOverlap(eventWindow(event as any), window)) return event;
  }
  return null;
}

/**
 * The profile everyone may see (clients included): no phone, email or
 * workload. `window` is optional; without it busyOn is always null.
 */
export function buildPublicProfile(
  member: any,
  data: { staffAssignments: Assignment[]; events: EventLike[]; staffRatings: Rating[] },
  window?: BookingWindow,
  excludeEventId?: string,
) {
  const completed = completedEventIds(member.id, data.staffAssignments, data.events);
  const { rating, ratingCount } = ratingSummary(member.id, data.staffRatings);
  const busy = window ? busyEventFor(member.id, window, data.staffAssignments, data.events, excludeEventId) : null;
  const reviews = data.staffRatings
    .filter((r) => r.staffId === member.id)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, 3)
    .map((r) => ({ stars: r.stars, comment: r.comment || '', by: r.ratedByName || 'Vendor', createdAt: r.createdAt }));

  return {
    id: member.id,
    name: member.name,
    initials: member.initials,
    role: member.role,
    avatar: member.avatar,
    vendor: member.vendor,
    vendorId: member.vendorId,
    experienceYears: Number(member.experienceYears || 0),
    skills: Array.isArray(member.skills) ? member.skills : [],
    bio: member.bio || '',
    eventsCompleted: completed.length,
    isNew: completed.length === 0,
    // A "New" person shows no rating at all, even if one slipped in
    rating: completed.length === 0 ? null : rating,
    ratingCount: completed.length === 0 ? 0 : ratingCount,
    reviews: completed.length === 0 ? [] : reviews,
    busyOn: busy ? { eventId: busy.id, eventName: busy.name, date: busy.date } : null,
  };
}
