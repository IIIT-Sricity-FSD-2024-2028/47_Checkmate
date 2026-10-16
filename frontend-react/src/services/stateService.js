import { get, put } from './apiClient';

/**
 * Fetch a shared in-memory application state value by key.
 *
 * @param {string} key - State key identifier (e.g., 'recruitments', 'platformSettings', 'monitorProgress')
 * @param {Object} [options] - Additional request options
 * @returns {Promise<any>}
 */
export async function getStateKey(key, options = {}) {
  return get(`/state/${encodeURIComponent(key)}`, options);
}

/**
 * Set / replace a shared application state value by key.
 *
 * @param {string} key - State key identifier
 * @param {any} value - Value to store under the state key
 * @param {Object} [options] - Additional request options
 * @returns {Promise<any>}
 */
export async function setStateKey(key, value, options = {}) {
  return put(`/state/${encodeURIComponent(key)}`, { value }, options);
}

/**
 * Retrieve the full sanitized database snapshot.
 *
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function getSnapshot(options = {}) {
  return get('/snapshot', options);
}

// ── Helpers for known application state keys used across the portals ──

export async function getCoordinationMessages(options) {
  return (await getStateKey('coordinationMessages', options)) || [];
}

export async function setCoordinationMessages(messages, options) {
  return setStateKey('coordinationMessages', messages, options);
}

export async function getMonitorProgress(options) {
  return (await getStateKey('monitorProgress', options)) || {};
}

export async function setMonitorProgress(progress, options) {
  return setStateKey('monitorProgress', progress, options);
}

export async function getResourceAllocations(options) {
  return (await getStateKey('resourceAllocations', options)) || [];
}

export async function setResourceAllocations(allocations, options) {
  return setStateKey('resourceAllocations', allocations, options);
}

export async function getStaffRequests(options) {
  return (await getStateKey('staffRequests', options)) || [];
}

export async function setStaffRequests(requests, options) {
  return setStateKey('staffRequests', requests, options);
}

export async function getContingencyPlans(options) {
  return (await getStateKey('contingencyPlans', options)) || [];
}

export async function setContingencyPlans(plans, options) {
  return setStateKey('contingencyPlans', plans, options);
}

const stateService = {
  getStateKey,
  setStateKey,
  getSnapshot,
  getCoordinationMessages,
  setCoordinationMessages,
  getMonitorProgress,
  setMonitorProgress,
  getResourceAllocations,
  setResourceAllocations,
  getStaffRequests,
  setStaffRequests,
  getContingencyPlans,
  setContingencyPlans,
};

export default stateService;
