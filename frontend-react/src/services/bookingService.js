import { del, get, patch, post, put } from './apiClient';
import { getAuthSession } from './auth/authStorage';

/**
 * Fetch all bookings (Admin, Superuser, Vendor, Client).
 *
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Array<Object>>}
 */
export async function getBookings(options = {}) {
  return get('/bookings', options);
}

/**
 * Fetch a specific booking by ID.
 *
 * @param {string} id - Booking ID
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function getBookingById(id, options = {}) {
  return get(`/bookings/${encodeURIComponent(id)}`, options);
}

/**
 * Retrieve financial commission ledger and vendor payout obligations.
 *
 * @param {Object} [params] - Query filter parameters { vendorId?, payoutStatus?, eventId? }
 * @param {Object} [options] - Additional request options
 * @returns {Promise<{ summary: Object, items: Array<Object> }>}
 */
export async function getCommissions(params = {}, options = {}) {
  return get('/bookings/commissions', { ...options, params });
}

/**
 * Alias for getCommissions().
 */
export async function getBookingsCommissions(params = {}, options = {}) {
  return getCommissions(params, options);
}

/**
 * Create a new billable booking (Admin, Superuser, Vendor).
 * Automatically calculates platform commission split (10%) and vendor payout share (90%).
 *
 * @param {Object} bookingData - Booking details
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function createBooking(bookingData, options = {}) {
  return post('/bookings', bookingData, options);
}

/**
 * Replace / update a booking by ID via PUT (Admin, Superuser, Vendor).
 *
 * @param {string} id - Booking ID
 * @param {Object} bookingData - Updated booking data
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function updateBooking(id, bookingData, options = {}) {
  return put(`/bookings/${encodeURIComponent(id)}`, bookingData, options);
}

/**
 * Partially update a booking by ID via PATCH (Admin, Superuser, Vendor).
 *
 * @param {string} id - Booking ID
 * @param {Object} bookingData - Patch fields for booking
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function patchBooking(id, bookingData, options = {}) {
  return patch(`/bookings/${encodeURIComponent(id)}`, bookingData, options);
}

/**
 * Settle and release vendor payout for a confirmed booking (Admin / Superuser only).
 *
 * @param {string} id - Booking ID
 * @param {Object} [settleData] - { settledBy?: string, note?: string }
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function settlePayout(id, settleData = {}, options = {}) {
  const customHeaders = { ...(options.headers || {}) };
  if (settleData?.settledBy && !customHeaders['x-user-id']) {
    customHeaders['x-user-id'] = settleData.settledBy;
  }

  return patch(`/bookings/${encodeURIComponent(id)}/settle`, settleData, {
    ...options,
    headers: customHeaders,
  });
}

/**
 * Alias for settlePayout().
 */
export async function settleBookingPayout(id, settleData, options) {
  return settlePayout(id, settleData, options);
}

/**
 * Delete a booking by ID (Admin / Superuser only).
 *
 * @param {string} id - Booking ID
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function deleteBooking(id, options = {}) {
  return del(`/bookings/${encodeURIComponent(id)}`, options);
}

/**
 * Filter bookings down to those belonging to the current user (Vendor or Client).
 *
 * @param {Array<Object>} bookings - All bookings
 * @param {Object} [session] - Custom auth session
 * @returns {Array<Object>}
 */
export function filterMyBookings(bookings, session) {
  if (!Array.isArray(bookings)) return [];
  const s = session || getAuthSession();
  if (!s) return bookings;

  const role = (s.role || s.user?.role || '').toLowerCase();
  const user = s.user || s;
  const userName = (user.name || user.user || '').toLowerCase();
  const userEmail = (user.email || '').toLowerCase();
  const vendorId = (user.vendorId || '').toLowerCase();
  const vendorName = (user.vendorName || user.businessName || userName || '').toLowerCase();

  if (role === 'admin' || role === 'superuser') return bookings;

  if (role === 'vendor') {
    return bookings.filter((b) => {
      const bVendorId = (b.vendorId || '').toLowerCase();
      const bVendor = (b.vendor || '').toLowerCase();
      return (
        (vendorId && bVendorId === vendorId) ||
        bVendor === vendorName ||
        (userName && bVendor === userName)
      );
    });
  }

  if (role === 'client') {
    return bookings.filter((b) => {
      const bClient = (b.client || '').toLowerCase();
      const bClientEmail = (b.clientEmail || '').toLowerCase();
      return (
        (userName && bClient === userName) ||
        (userEmail && bClientEmail === userEmail)
      );
    });
  }

  return bookings;
}

/**
 * Fetch bookings scoped to current user's role (Client, Vendor, or Admin).
 *
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Array<Object>>}
 */
export async function getMyBookings(options = {}) {
  const bookings = await getBookings(options);
  return filterMyBookings(bookings, options.session || getAuthSession());
}

const bookingService = {
  getBookings,
  getBookingById,
  getCommissions,
  getBookingsCommissions,
  createBooking,
  updateBooking,
  patchBooking,
  settlePayout,
  settleBookingPayout,
  deleteBooking,
  filterMyBookings,
  getMyBookings,
};

export default bookingService;
