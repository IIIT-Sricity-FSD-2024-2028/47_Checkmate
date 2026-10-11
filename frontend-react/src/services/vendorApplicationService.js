import { del, get, patch, post, put } from './apiClient';

/**
 * Fetch all vendor applications in the review queue (Admin, Superuser, Vendor).
 *
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Array<Object>>}
 */
export async function getVendorApplications(options = {}) {
  return get('/vendor-applications', options);
}

/**
 * Fetch a specific vendor application by ID.
 *
 * @param {string} id - Vendor Application ID
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function getVendorApplicationById(id, options = {}) {
  return get(`/vendor-applications/${encodeURIComponent(id)}`, options);
}

/**
 * Submit a new vendor application (Public registration endpoint).
 *
 * @param {Object} applicationData - Application payload
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function createVendorApplication(applicationData, options = {}) {
  return post('/vendor-applications', applicationData, {
    ...options,
    isPublic: true,
  });
}

/**
 * Replace / update a vendor application by ID via PUT.
 *
 * @param {string} id - Vendor Application ID
 * @param {Object} applicationData - Updated application data
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function updateVendorApplication(id, applicationData, options = {}) {
  return put(`/vendor-applications/${encodeURIComponent(id)}`, applicationData, options);
}

/**
 * Partially update a vendor application by ID via PATCH.
 *
 * @param {string} id - Vendor Application ID
 * @param {Object} applicationData - Patch fields for application
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function patchVendorApplication(id, applicationData, options = {}) {
  return patch(`/vendor-applications/${encodeURIComponent(id)}`, applicationData, options);
}

/**
 * Approve or reject a vendor application (Admin / Superuser only).
 * Triggers automated provisioning of Vendor entity and active user credentials upon approval.
 * Supports decideVendorApplication(id, { status: 'approved', note: '...' }) or decideVendorApplication(id, 'approved', '...').
 *
 * @param {string} id - Vendor Application ID
 * @param {Object|string} decisionOrStatus - { status: 'approved' | 'rejected', note?: string } or status string
 * @param {string} [note] - Reviewer note
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function decideVendorApplication(id, decisionOrStatus, note, options = {}) {
  let body;
  let requestOptions = options;

  if (typeof decisionOrStatus === 'string') {
    body = { status: decisionOrStatus, note };
  } else if (decisionOrStatus && typeof decisionOrStatus === 'object') {
    body = decisionOrStatus;
    if (note && typeof note === 'object') {
      requestOptions = note;
    }
  } else {
    body = {};
  }

  return patch(
    `/vendor-applications/${encodeURIComponent(id)}/decision`,
    body,
    requestOptions
  );
}

/**
 * Delete a vendor application by ID (Admin / Superuser only).
 *
 * @param {string} id - Vendor Application ID
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function deleteVendorApplication(id, options = {}) {
  return del(`/vendor-applications/${encodeURIComponent(id)}`, options);
}

const vendorApplicationService = {
  getVendorApplications,
  getVendorApplicationById,
  createVendorApplication,
  updateVendorApplication,
  patchVendorApplication,
  decideVendorApplication,
  deleteVendorApplication,
};

export default vendorApplicationService;
