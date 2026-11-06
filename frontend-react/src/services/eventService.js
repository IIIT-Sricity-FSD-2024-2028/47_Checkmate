import { del, get, patch, post, put } from './apiClient';
import { getAuthSession } from './auth/authStorage';

/**
 * Fetch all events (accessible by Admin, Superuser, Vendor, Client, Staff).
 *
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Array<Object>>}
 */
export async function getEvents(options = {}) {
  return get('/events', options);
}

/**
 * Fetch an event by ID.
 *
 * @param {string} id - Event ID
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function getEventById(id, options = {}) {
  return get(`/events/${encodeURIComponent(id)}`, options);
}

/**
 * Create a new event request.
 *
 * @param {Object} eventData - Event data (CreateEventDto)
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function createEvent(eventData, options = {}) {
  return post('/events', eventData, options);
}

/**
 * Replace / update an event by ID via PUT.
 *
 * @param {string} id - Event ID
 * @param {Object} eventData - Updated event data
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function updateEvent(id, eventData, options = {}) {
  return put(`/events/${encodeURIComponent(id)}`, eventData, options);
}

/**
 * Partially update an event by ID via PATCH.
 *
 * @param {string} id - Event ID
 * @param {Object} eventData - Patch fields for event
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function patchEvent(id, eventData, options = {}) {
  return patch(`/events/${encodeURIComponent(id)}`, eventData, options);
}

/**
 * Update event lifecycle status (e.g., approved, confirmed, live, completed, rejected).
 * Can be called as updateEventStatus(id, { status, note }) or updateEventStatus(id, 'approved', 'Note').
 *
 * @param {string} id - Event ID
 * @param {Object|string} statusOrPayload - Status string or { status, note } object
 * @param {string} [note] - Optional note if status was passed as a string
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function updateEventStatus(id, statusOrPayload, note, options = {}) {
  let body;
  let requestOptions = options;

  if (typeof statusOrPayload === 'string') {
    body = { status: statusOrPayload, note };
  } else if (statusOrPayload && typeof statusOrPayload === 'object') {
    body = statusOrPayload;
    if (note && typeof note === 'object') {
      requestOptions = note;
    }
  } else {
    body = {};
  }

  return patch(`/events/${encodeURIComponent(id)}/status`, body, requestOptions);
}

/**
 * Delete an event by ID.
 *
 * @param {string} id - Event ID
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function deleteEvent(id, options = {}) {
  return del(`/events/${encodeURIComponent(id)}`, options);
}

/**
 * Filter an array of events down to events belonging to the current user/tenant.
 * Direct equivalent of the DB.getMyEvents() logic from the original front-end.
 *
 * @param {Array<Object>} events - All events
 * @param {Object} [session] - Custom auth session (defaults to current active session)
 * @returns {Array<Object>}
 */
export function filterMyEvents(events, session) {
  if (!Array.isArray(events)) return [];
  const s = session || getAuthSession();
  if (!s) return events;

  const role = (s.role || s.user?.role || '').toLowerCase();
  const user = s.user || s;
  const userId = (user.id || user.userId || '').toLowerCase();
  const userName = (user.name || user.user || '').toLowerCase();
  const userEmail = (user.email || '').toLowerCase();
  const vendorId = (user.vendorId || '').toLowerCase();
  const vendorName = (user.vendorName || user.businessName || userName || '').toLowerCase();
  const staffId = (user.staffId || '').toLowerCase();

  if (role === 'admin' || role === 'superuser') {
    return events;
  }

  if (role === 'vendor') {
    return events.filter((ev) => {
      const evVId = (ev.vendorId || '').toLowerCase();
      const evVName = (ev.vendor || '').toLowerCase();
      const evVEmail = (ev.vendorEmail || '').toLowerCase();
      const evCreated = (ev.createdBy || '').toLowerCase();

      if (vendorId && evVId === vendorId) return true;
      if (vendorName && (evVName === vendorName || evVName.includes(vendorName) || vendorName.includes(evVName))) return true;
      if (userEmail && (evVEmail === userEmail || evCreated === userEmail)) return true;
      if (userId && (evCreated === userId || ev.createdBy === user.id)) return true;
      if (Array.isArray(ev.vendorIds) && vendorId && ev.vendorIds.map((v) => String(v).toLowerCase()).includes(vendorId)) return true;
      if (Array.isArray(ev.vendors)) {
        return ev.vendors.some((v) => {
          if (typeof v === 'string') return v.toLowerCase() === vendorName;
          if (v && typeof v === 'object') {
            return (
              (v.id && String(v.id).toLowerCase() === vendorId) ||
              (v.name && v.name.toLowerCase() === vendorName)
            );
          }
          return false;
        });
      }
      return false;
    });
  }

  if (role === 'client') {
    return events.filter((ev) => {
      const evCId = (ev.clientId || '').toLowerCase();
      const evCEmail = (ev.clientEmail || '').toLowerCase();
      const evCName = (ev.client || '').toLowerCase();
      const evCreated = (ev.createdBy || '').toLowerCase();

      // Explicit match: client ID, client email, or createdBy user ID
      if (userId && evCId && evCId === userId) return true;
      if (userEmail && (evCEmail === userEmail || evCreated === userEmail)) return true;
      if (userId && evCreated === userId) return true;
      // Exact name match ONLY IF no ID or email was recorded on this event
      if (!evCId && !evCEmail && userName && evCName === userName) return true;

      return false;
    });
  }

  if (role === 'staff') {
    return events.filter((ev) => {
      if (Array.isArray(ev.assignedStaff) && (staffId || userEmail)) {
        return ev.assignedStaff.some(
          (st) => (staffId && st.staffId === staffId) || (userEmail && st.email === userEmail)
        );
      }
      return true;
    });
  }

  return events;
}

/**
 * Fetch events filtered to the current signed-in user's events (Client, Vendor, Staff, or Admin).
 *
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Array<Object>>}
 */
export async function getMyEvents(options = {}) {
  const events = await getEvents(options);
  return filterMyEvents(events, options.session || getAuthSession());
}

/**
 * Parses time strings like "18:00", "6:00 PM", "09:30", "6pm", "18:00:00" into minutes from midnight (0–1439).
 *
 * @param {string} timeStr - Time string
 * @returns {number|null} Minutes from midnight or null if invalid
 */
export function parseTimeToMinutes(timeStr) {
  if (!timeStr) return null;
  const clean = String(timeStr).trim().toLowerCase();
  const match = clean.match(/^(\d{1,2})(?::(\d{2}))?(?::\d{2})?(?:\s*(am|pm))?/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const meridiem = match[3]?.toLowerCase();
  if (meridiem === 'pm' && hours < 12) hours += 12;
  if (meridiem === 'am' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

/**
 * Checks for a venue, date, and time collision between an incoming/pending event request
 * and an existing confirmed/live event.
 *
 * @param {Object} pendingEvent - The incoming event being reviewed
 * @param {Object} confirmedEvent - An existing event in the database
 * @returns {Object|null} Collision detail object or null if no conflict
 */
export function checkEventCollision(pendingEvent, confirmedEvent) {
  if (!pendingEvent || !confirmedEvent) return null;
  if (pendingEvent.id === confirmedEvent.id) return null;

  // Only check against confirmed, approved, or live events
  const confStatus = String(confirmedEvent.status || '').toLowerCase();
  if (!['confirmed', 'approved', 'live'].includes(confStatus)) return null;

  // Both must have dates
  if (!pendingEvent.date || !confirmedEvent.date) return null;
  const pDate = String(pendingEvent.date).split('T')[0];
  const cDate = String(confirmedEvent.date).split('T')[0];
  if (pDate !== cDate) return null;

  // Both must have venues (ignore unassigned/TBD venues)
  const pVenue = String(pendingEvent.venue || '').trim().toLowerCase();
  const cVenue = String(confirmedEvent.venue || '').trim().toLowerCase();
  if (!pVenue || !cVenue || pVenue === 'venue tbd' || cVenue === 'venue tbd' || pVenue === 'tbd' || cVenue === 'tbd') return null;
  if (pVenue !== cVenue) return null;

  // Same date and venue confirmed! Inspect time overlap
  const pTimeRaw = pendingEvent.time || pendingEvent.startTime;
  const cTimeRaw = confirmedEvent.time || confirmedEvent.startTime;
  const pMinutes = parseTimeToMinutes(pTimeRaw);
  const cMinutes = parseTimeToMinutes(cTimeRaw);

  let isDirectTimeOverlap = false;
  let timeDesc = '';
  let severity = 'high';

  if (pMinutes !== null && cMinutes !== null) {
    const diffHours = Math.abs(pMinutes - cMinutes) / 60;
    if (diffHours < 4) {
      isDirectTimeOverlap = true;
      timeDesc = `at ${pTimeRaw || 'scheduled time'} (overlaps with ${cTimeRaw || 'existing booking'})`;
      severity = 'high';
    } else {
      isDirectTimeOverlap = false;
      timeDesc = `on same date (request at ${pTimeRaw}, confirmed at ${cTimeRaw})`;
      severity = 'medium';
    }
  } else {
    // If either event does not specify an exact time slot, treat as full-day reservation
    isDirectTimeOverlap = true;
    timeDesc = `on ${pDate} (shared date slot)`;
    severity = 'high';
  }

  return {
    type: isDirectTimeOverlap ? 'Venue & Time Collision' : 'Same-Day Venue Collision',
    category: 'venue',
    venue: pendingEvent.venue,
    date: pDate,
    timeDesc,
    conflictingEvent: confirmedEvent,
    desc: `Venue "${pendingEvent.venue}" is already booked ${timeDesc} by confirmed event "${confirmedEvent.name || confirmedEvent.id}" (${confirmedEvent.id})`,
    severity,
  };
}

/**
 * Scans an array of all events to find any confirmed/live event colliding with a pending request.
 *
 * @param {Object} pendingEvent - The event to check
 * @param {Array<Object>} allEvents - All events in the database
 * @returns {Array<Object>} List of collisions found
 */
export function findEventCollisions(pendingEvent, allEvents) {
  if (!pendingEvent || !Array.isArray(allEvents)) return [];
  const collisions = [];
  allEvents.forEach((existing) => {
    const col = checkEventCollision(pendingEvent, existing);
    if (col) collisions.push(col);
  });
  return collisions;
}

const eventService = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  patchEvent,
  updateEventStatus,
  deleteEvent,
  filterMyEvents,
  getMyEvents,
  parseTimeToMinutes,
  checkEventCollision,
  findEventCollisions,
};

export default eventService;
