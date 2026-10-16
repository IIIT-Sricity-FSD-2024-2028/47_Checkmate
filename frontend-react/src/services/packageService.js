import { del, get, patch, post, put } from './apiClient';
import { getAuthSession } from './auth/authStorage';

/**
 * Fetch all event service packages.
 *
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Array<Object>>}
 */
export async function getPackages(options = {}) {
  return get('/packages', options);
}

/**
 * Fetch a package by ID.
 *
 * @param {string} id - Package ID
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function getPackageById(id, options = {}) {
  return get(`/packages/${encodeURIComponent(id)}`, options);
}

/**
 * Create a new event package (Vendor, Admin, Superuser).
 *
 * @param {Object} packageData - Package data
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function createPackage(packageData, options = {}) {
  return post('/packages', packageData, options);
}

/**
 * Replace / update a package by ID via PUT.
 *
 * @param {string} id - Package ID
 * @param {Object} packageData - Updated package data
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function updatePackage(id, packageData, options = {}) {
  return put(`/packages/${encodeURIComponent(id)}`, packageData, options);
}

/**
 * Partially update a package by ID via PATCH.
 *
 * @param {string} id - Package ID
 * @param {Object} packageData - Patch fields for package
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function patchPackage(id, packageData, options = {}) {
  return patch(`/packages/${encodeURIComponent(id)}`, packageData, options);
}

/**
 * Approve or reject a vendor package (Admin / Superuser only).
 * Supports decidePackage(id, { status: 'approved' }) or decidePackage(id, 'approved').
 *
 * @param {string} id - Package ID
 * @param {Object|string} decisionOrStatus - { status: 'pending' | 'approved' | 'rejected' } or status string
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function decidePackage(id, decisionOrStatus, options = {}) {
  let body;
  let requestOptions = options;

  if (typeof decisionOrStatus === 'string') {
    body = { status: decisionOrStatus };
  } else if (decisionOrStatus && typeof decisionOrStatus === 'object') {
    body = decisionOrStatus;
  } else {
    body = {};
  }

  return patch(`/packages/${encodeURIComponent(id)}/decision`, body, requestOptions);
}

/**
 * Delete a package by ID.
 *
 * @param {string} id - Package ID
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function deletePackage(id, options = {}) {
  return del(`/packages/${encodeURIComponent(id)}`, options);
}

/**
 * Filter packages to those owned by the current vendor.
 *
 * @param {Array<Object>} packages - All packages
 * @param {Object} [session] - Custom auth session
 * @returns {Array<Object>}
 */
export function filterMyPackages(packages, session) {
  if (!Array.isArray(packages)) return [];
  const s = session || getAuthSession();
  if (!s) return packages;

  const role = (s.role || s.user?.role || '').toLowerCase();
  const user = s.user || s;
  const userId = (user.id || user.userId || '').toLowerCase();
  const userName = (user.name || user.user || '').toLowerCase();
  const userEmail = (user.email || '').toLowerCase();
  const vendorId = (user.vendorId || '').toLowerCase();
  const vendorName = (user.vendorName || user.businessName || userName || '').toLowerCase();

  if (role === 'admin' || role === 'superuser') return packages;

  if (role === 'vendor') {
    return packages.filter((p) => {
      const pVId = (p.vendorId || '').toLowerCase();
      const pVName = (p.vendorName || p.vendor || '').toLowerCase();

      return (
        (vendorId && pVId === vendorId) ||
        (vendorName && (pVName === vendorName || pVName.includes(vendorName))) ||
        (p.createdBy === userEmail || p.createdBy === userId || p.createdBy === user.id)
      );
    });
  }

  return packages;
}

/**
 * Fetch packages owned by the signed-in vendor.
 *
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Array<Object>>}
 */
export async function getMyPackages(options = {}) {
  const packages = await getPackages(options);
  return filterMyPackages(packages, options.session || getAuthSession());
}

/**
 * Fetch public / approved packages available for clients to browse in the marketplace.
 *
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Array<Object>>}
 */
export async function getMarketplacePackages(options = {}) {
  const packages = await getPackages(options);
  return packages.filter(
    (p) => !p.status || p.status.toLowerCase() === 'approved' || p.status.toLowerCase() === 'active'
  );
}

const packageService = {
  getPackages,
  getPackageById,
  createPackage,
  updatePackage,
  patchPackage,
  decidePackage,
  deletePackage,
  filterMyPackages,
  getMyPackages,
  getMarketplacePackages,
};

export default packageService;
