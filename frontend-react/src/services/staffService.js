import { del, get, patch, post, put } from './apiClient';
import { getAuthSession } from './auth/authStorage';

/**
 * Fetch all staff members.
 *
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Array<Object>>}
 */
export async function getStaff(options = {}) {
  return get('/staff', options);
}

/**
 * Fetch a staff member by ID.
 *
 * @param {string} id - Staff ID
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function getStaffById(id, options = {}) {
  return get(`/staff/${encodeURIComponent(id)}`, options);
}

/**
 * Create a new staff member (Vendor, Admin, Superuser).
 *
 * @param {Object} staffData - Staff member data
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function createStaff(staffData, options = {}) {
  return post('/staff', staffData, options);
}

/**
 * Replace / update a staff member by ID via PUT.
 *
 * @param {string} id - Staff ID
 * @param {Object} staffData - Updated staff data
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function updateStaff(id, staffData, options = {}) {
  return put(`/staff/${encodeURIComponent(id)}`, staffData, options);
}

/**
 * Partially update a staff member by ID via PATCH.
 *
 * @param {string} id - Staff ID
 * @param {Object} staffData - Patch fields for staff
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function patchStaff(id, staffData, options = {}) {
  return patch(`/staff/${encodeURIComponent(id)}`, staffData, options);
}

/**
 * Delete a staff member by ID.
 *
 * @param {string} id - Staff ID
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function deleteStaff(id, options = {}) {
  return del(`/staff/${encodeURIComponent(id)}`, options);
}

/**
 * Staff portal registration (Public endpoint).
 *
 * @param {Object} staffData - { name, email, phone?, password }
 * @param {Object} [options] - Additional request options
 * @returns {Promise<{ user: Object, role: 'staff', token: string }>}
 */
export async function staffSignup(staffData, options = {}) {
  return post('/staff/signup', staffData, {
    ...options,
    isPublic: true,
  });
}

/**
 * Staff portal authentication (Public endpoint).
 *
 * @param {Object|string} credentialsOrEmail - Credentials object or email
 * @param {string} [password] - Password
 * @param {Object} [options] - Additional request options
 * @returns {Promise<{ user: Object, role: 'staff', token: string }>}
 */
export async function staffLogin(credentialsOrEmail, password, options = {}) {
  let credentials;
  let requestOptions = options;

  if (typeof credentialsOrEmail === 'string') {
    credentials = { email: credentialsOrEmail, password };
  } else if (credentialsOrEmail && typeof credentialsOrEmail === 'object') {
    credentials = credentialsOrEmail;
    if (password && typeof password === 'object') {
      requestOptions = password;
    }
  } else {
    credentials = {};
  }

  return post('/staff/login', credentials, {
    ...requestOptions,
    isPublic: true,
  });
}

/**
 * Get staff member operational profile by email.
 *
 * @param {string} email - Staff member email
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function getStaffProfile(email, options = {}) {
  return get(`/staff/profile/${encodeURIComponent(email)}`, options);
}

/**
 * Fetch all staff event assignments.
 *
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Array<Object>>}
 */
export async function getStaffAssignments(options = {}) {
  return get('/staff-assignments', options);
}

/**
 * Create a new staff event assignment.
 *
 * @param {Object} assignmentData - Assignment details
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function createStaffAssignment(assignmentData, options = {}) {
  return post('/staff-assignments', assignmentData, options);
}

/**
 * Replace / update a staff assignment by ID via PUT.
 *
 * @param {string} id - Assignment ID
 * @param {Object} assignmentData - Updated assignment details
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function updateStaffAssignment(id, assignmentData, options = {}) {
  return put(`/staff-assignments/${encodeURIComponent(id)}`, assignmentData, options);
}

/**
 * Partially update a staff assignment by ID via PATCH.
 *
 * @param {string} id - Assignment ID
 * @param {Object} assignmentData - Patch details
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function patchStaffAssignment(id, assignmentData, options = {}) {
  return patch(`/staff-assignments/${encodeURIComponent(id)}`, assignmentData, options);
}

/**
 * Delete a staff assignment by ID.
 *
 * @param {string} id - Assignment ID
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function deleteStaffAssignment(id, options = {}) {
  return del(`/staff-assignments/${encodeURIComponent(id)}`, options);
}

/**
 * Filter an array of staff members down to those associated with the current vendor or user.
 *
 * @param {Array<Object>} staffList - All staff
 * @param {Object} [session] - Custom auth session
 * @returns {Array<Object>}
 */
export function filterMyStaff(staffList, session) {
  if (!Array.isArray(staffList)) return [];
  const s = session || getAuthSession();
  if (!s) return staffList;

  const role = (s.role || s.user?.role || '').toLowerCase();
  const user = s.user || s;
  const userId = (user.id || user.userId || '').toLowerCase();
  const userName = (user.name || user.user || '').toLowerCase();
  const userEmail = (user.email || '').toLowerCase();
  const vendorId = (user.vendorId || '').toLowerCase();
  const vendorName = (user.vendorName || user.businessName || userName || '').toLowerCase();
  const staffId = (user.staffId || '').toLowerCase();

  if (role === 'admin' || role === 'superuser') return staffList;

  if (role === 'vendor') {
    return staffList.filter((st) => {
      const sVId = (st.vendorId || '').toLowerCase();
      const sVName = (st.vendor || '').toLowerCase();
      const sVEmail = (st.vendorEmail || '').toLowerCase();
      const sCreated = (st.createdBy || '').toLowerCase();
      const unassigned = !sVId && !sVName && !sVEmail && !sCreated;

      return (
        unassigned ||
        (vendorId && sVId === vendorId) ||
        (vendorName && (sVName === vendorName || sVName.includes(vendorName))) ||
        (userEmail && (sVEmail === userEmail || sCreated === userEmail)) ||
        (userId && (sCreated === userId || st.createdBy === user.id))
      );
    });
  }

  if (role === 'staff') {
    return staffList.filter(
      (st) =>
        (staffId && st.id === staffId) ||
        (userEmail && st.email && st.email.toLowerCase() === userEmail)
    );
  }

  return staffList;
}

/**
 * Fetch staff scoped to current user's role.
 *
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Array<Object>>}
 */
export async function getMyStaff(options = {}) {
  const staffList = await getStaff(options);
  return filterMyStaff(staffList, options.session || getAuthSession());
}

/**
 * Fetch staff assignments for the current staff member or vendor.
 *
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Array<Object>>}
 */
export async function getMyAssignments(options = {}) {
  const assignments = await getStaffAssignments(options);
  const s = options.session || getAuthSession();
  if (!s) return assignments;

  const role = (s.role || s.user?.role || '').toLowerCase();
  const user = s.user || s;
  const staffId = (user.staffId || user.id || '').toLowerCase();
  const userEmail = (user.email || '').toLowerCase();
  const userName = (user.name || user.user || '').toLowerCase();

  if (role === 'staff') {
    return assignments.filter(
      (a) =>
        (staffId && a.staffId?.toLowerCase() === staffId) ||
        (userEmail && a.staffEmail?.toLowerCase() === userEmail) ||
        (userName && a.staffName?.toLowerCase() === userName)
    );
  }

  return assignments;
}

const staffService = {
  getStaff,
  getStaffById,
  createStaff,
  updateStaff,
  patchStaff,
  deleteStaff,
  staffSignup,
  staffLogin,
  getStaffProfile,
  getStaffAssignments,
  createStaffAssignment,
  updateStaffAssignment,
  patchStaffAssignment,
  deleteStaffAssignment,
  filterMyStaff,
  getMyStaff,
  getMyAssignments,
};

export default staffService;
