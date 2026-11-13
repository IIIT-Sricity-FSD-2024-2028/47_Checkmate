import { del, get, patch, post, put } from './apiClient';
import { getAuthSession } from './auth/authStorage';

/**
 * Fetch all resources / inventory items.
 *
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Array<Object>>}
 */
export async function getResources(options = {}) {
  return get('/resources', options);
}

/**
 * Fetch a resource by ID.
 *
 * @param {string} id - Resource ID
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function getResourceById(id, options = {}) {
  return get(`/resources/${encodeURIComponent(id)}`, options);
}

/**
 * Ask the backend how many units of every resource are free for a date window.
 * A resource booked on another date counts as free here.
 *
 * @param {Object} query - { date, endDate, time, endTime, excludeEventId } or { eventId }
 *   eventId alone = that event's own date/time, ignoring its own allocations.
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Array<{resourceId, name, total, allocated, available, date, endDate}>>}
 */
export async function getResourceAvailability(query, options = {}) {
  return get('/resources/availability', { ...options, params: query });
}

/**
 * Same as getResourceAvailability, but returned as { [resourceId]: availableUnits }
 * so a page can look a number up directly.
 *
 * @param {Object} query - See getResourceAvailability
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object<string, number>>}
 */
export async function getResourceAvailabilityMap(query, options = {}) {
  const rows = await getResourceAvailability(query, options);
  const map = {};
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    map[row.resourceId] = Number(row.available) || 0;
  });
  return map;
}

/**
 * Create a new inventory resource (Vendors, Admins, Superusers).
 *
 * @param {Object} resourceData - Resource creation data
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function createResource(resourceData, options = {}) {
  return post('/resources', resourceData, options);
}

/**
 * Replace / update a resource by ID via PUT.
 *
 * @param {string} id - Resource ID
 * @param {Object} resourceData - Updated resource data
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function updateResource(id, resourceData, options = {}) {
  return put(`/resources/${encodeURIComponent(id)}`, resourceData, options);
}

/**
 * Partially update a resource by ID via PATCH.
 *
 * @param {string} id - Resource ID
 * @param {Object} resourceData - Patch fields for resource
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function patchResource(id, resourceData, options = {}) {
  return patch(`/resources/${encodeURIComponent(id)}`, resourceData, options);
}

/**
 * Delete a resource by ID.
 *
 * @param {string} id - Resource ID
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function deleteResource(id, options = {}) {
  return del(`/resources/${encodeURIComponent(id)}`, options);
}

/**
 * Filter an array of resources down to those owned by the current vendor.
 *
 * @param {Array<Object>} resources - All resources
 * @param {Object} [session] - Custom auth session
 * @returns {Array<Object>}
 */
export function filterMyResources(resources, session) {
  if (!Array.isArray(resources)) return [];
  const s = session || getAuthSession();
  if (!s) return resources;

  const role = (s.role || s.user?.role || '').toLowerCase();
  const user = s.user || s;
  const userId = (user.id || user.userId || '').toLowerCase();
  const userName = (user.name || user.user || '').toLowerCase();
  const userEmail = (user.email || '').toLowerCase();
  const vendorId = (user.vendorId || '').toLowerCase();
  const vendorName = (user.vendorName || user.businessName || userName || '').toLowerCase();

  if (role === 'admin' || role === 'superuser') return resources;

  if (role === 'vendor') {
    return resources.filter((r) => {
      const rVId = (r.vendorId || '').toLowerCase();
      const rVName = (r.vendor || '').toLowerCase();
      const rVEmail = (r.vendorEmail || '').toLowerCase();
      const rCreated = (r.createdBy || '').toLowerCase();

      return (
        (vendorId && rVId === vendorId) ||
        (vendorName && (rVName === vendorName || rVName.includes(vendorName))) ||
        (userEmail && (rVEmail === userEmail || rCreated === userEmail)) ||
        (userId && (rCreated === userId || r.createdBy === user.id))
      );
    });
  }

  return resources;
}

/**
 * Fetch resources scoped to the current signed-in vendor (or all resources if Admin/Client).
 *
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Array<Object>>}
 */
export async function getMyResources(options = {}) {
  const resources = await getResources(options);
  return filterMyResources(resources, options.session || getAuthSession());
}

const resourceService = {
  getResources,
  getResourceById,
  getResourceAvailability,
  getResourceAvailabilityMap,
  createResource,
  updateResource,
  patchResource,
  deleteResource,
  filterMyResources,
  getMyResources,
};

export default resourceService;
