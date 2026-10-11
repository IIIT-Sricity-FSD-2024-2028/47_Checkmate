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

      if (userId && evCId === userId) return true;
      if (userEmail && (evCEmail === userEmail || evCreated === userEmail)) return true;
      if (userName && (evCName === userName || evCName.includes(userName) || userName.includes(evCName))) return true;
      if (evCreated === 'client' && (!ev.clientEmail || ev.clientEmail.toLowerCase() === userEmail)) return true;
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
};

export default eventService;
