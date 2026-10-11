import { del, get, patch, post, put } from './apiClient';
import { getAuthSession } from './auth/authStorage';

/**
 * Fetch all incident / support issues.
 *
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Array<Object>>}
 */
export async function getIssues(options = {}) {
  return get('/issues', options);
}

/**
 * Fetch an issue by ID.
 *
 * @param {string} id - Issue ID
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function getIssueById(id, options = {}) {
  return get(`/issues/${encodeURIComponent(id)}`, options);
}

/**
 * Report a new issue.
 *
 * @param {Object} issueData - Issue data
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function createIssue(issueData, options = {}) {
  return post('/issues', issueData, options);
}

/**
 * Replace / update an issue by ID via PUT (Admin, Superuser, Vendor).
 *
 * @param {string} id - Issue ID
 * @param {Object} issueData - Updated issue data
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function updateIssue(id, issueData, options = {}) {
  return put(`/issues/${encodeURIComponent(id)}`, issueData, options);
}

/**
 * Partially update an issue by ID via PATCH (Admin, Superuser, Vendor).
 *
 * @param {string} id - Issue ID
 * @param {Object} issueData - Patch fields for issue
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function patchIssue(id, issueData, options = {}) {
  return patch(`/issues/${encodeURIComponent(id)}`, issueData, options);
}

/**
 * Delete an issue by ID (Admin, Superuser, Vendor).
 *
 * @param {string} id - Issue ID
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function deleteIssue(id, options = {}) {
  return del(`/issues/${encodeURIComponent(id)}`, options);
}

/**
 * Filter an array of issues down to issues reported by or relevant to the current user.
 *
 * @param {Array<Object>} issues - All issues
 * @param {Object} [session] - Custom auth session
 * @returns {Array<Object>}
 */
export function filterMyIssues(issues, session) {
  if (!Array.isArray(issues)) return [];
  const s = session || getAuthSession();
  if (!s) return issues;

  const role = (s.role || s.user?.role || '').toLowerCase();
  const user = s.user || s;
  const userName = (user.name || user.user || '').toLowerCase();
  const userEmail = (user.email || '').toLowerCase();

  if (role === 'admin' || role === 'superuser') return issues;

  return issues.filter((iss) => {
    const issReporter = (iss.reporter || '').toLowerCase();
    const issEmail = (iss.email || '').toLowerCase();

    return (
      (userName && (issReporter === userName || issReporter.includes(userName))) ||
      (userEmail && issEmail === userEmail)
    );
  });
}

/**
 * Fetch issues scoped to the current signed-in user.
 *
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Array<Object>>}
 */
export async function getMyIssues(options = {}) {
  const issues = await getIssues(options);
  return filterMyIssues(issues, options.session || getAuthSession());
}

const issueService = {
  getIssues,
  getIssueById,
  createIssue,
  updateIssue,
  patchIssue,
  deleteIssue,
  filterMyIssues,
  getMyIssues,
};

export default issueService;
