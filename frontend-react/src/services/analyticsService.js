import { get } from './apiClient';

/**
 * Fetch operational and financial summary metrics (Admin, Superuser, Vendor).
 *
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function getAnalyticsSummary(options = {}) {
  return get('/analytics/summary', options);
}

/**
 * Fetch executive financial summary with commission and payout breakdown (Admin / Superuser only).
 *
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function getFinancialSummary(options = {}) {
  return get('/analytics/financial-summary', options);
}

/**
 * Fetch public job postings / recruitment listings (Public endpoint).
 *
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Array<Object>>}
 */
export async function getPublicRecruitments(options = {}) {
  return get('/public/recruitments', {
    ...options,
    isPublic: true,
  });
}

/**
 * Fetch complete sanitized database snapshot to hydrate frontend stores.
 *
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function getSnapshot(options = {}) {
  return get('/snapshot', options);
}

const analyticsService = {
  getAnalyticsSummary,
  getFinancialSummary,
  getPublicRecruitments,
  getSnapshot,
};

export default analyticsService;
