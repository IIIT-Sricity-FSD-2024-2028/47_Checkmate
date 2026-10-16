import { del, get, patch, post, put } from './apiClient';

/**
 * Fetch all registered vendors.
 *
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Array<Object>>}
 */
export async function getVendors(options = {}) {
  return get('/vendors', options);
}

/**
 * Fetch a specific vendor by ID.
 *
 * @param {string} id - Vendor ID
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function getVendorById(id, options = {}) {
  return get(`/vendors/${encodeURIComponent(id)}`, options);
}

/**
 * Fetch financial earnings, commission deductions, and payout history for a vendor.
 *
 * @param {string} id - Vendor ID
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function getVendorPayouts(id, options = {}) {
  return get(`/vendors/${encodeURIComponent(id)}/payouts`, options);
}

/**
 * Create a vendor entity directly (Admin / Superuser only).
 *
 * @param {Object} vendorData - Vendor data
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function createVendor(vendorData, options = {}) {
  return post('/vendors', vendorData, options);
}

/**
 * Replace / update a vendor by ID via PUT (Admin / Superuser only).
 *
 * @param {string} id - Vendor ID
 * @param {Object} vendorData - Updated vendor data
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function updateVendor(id, vendorData, options = {}) {
  return put(`/vendors/${encodeURIComponent(id)}`, vendorData, options);
}

/**
 * Partially update a vendor by ID via PATCH (Admin / Superuser only).
 *
 * @param {string} id - Vendor ID
 * @param {Object} vendorData - Patch fields for vendor
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function patchVendor(id, vendorData, options = {}) {
  return patch(`/vendors/${encodeURIComponent(id)}`, vendorData, options);
}

/**
 * Delete a vendor by ID (Admin / Superuser only).
 *
 * @param {string} id - Vendor ID
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function deleteVendor(id, options = {}) {
  return del(`/vendors/${encodeURIComponent(id)}`, options);
}

const vendorService = {
  getVendors,
  getVendorById,
  getVendorPayouts,
  createVendor,
  updateVendor,
  patchVendor,
  deleteVendor,
};

export default vendorService;
