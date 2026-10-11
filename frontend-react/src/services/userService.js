import { del, get, patch, post, put } from './apiClient';

/**
 * Get profile for the currently authenticated user.
 *
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function getProfile(options = {}) {
  return get('/users/profile', options);
}

/**
 * Update profile details for the currently authenticated user.
 *
 * @param {Object} profileData - Profile fields (bio, phone, location, address, etc.)
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function updateProfile(profileData, options = {}) {
  return put('/users/profile', profileData, options);
}

/**
 * Upload an avatar image for the authenticated user.
 *
 * @param {File|Blob|FormData} fileOrFormData - The image file or pre-constructed FormData
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function uploadAvatar(fileOrFormData, options = {}) {
  let body;
  if (typeof FormData !== 'undefined' && fileOrFormData instanceof FormData) {
    body = fileOrFormData;
  } else {
    body = new FormData();
    body.append('file', fileOrFormData);
  }

  return post('/users/profile/avatar', body, options);
}

/**
 * Get all users (Admin / Superuser only).
 *
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Array<Object>>}
 */
export async function getUsers(options = {}) {
  return get('/users', options);
}

/**
 * Get a specific user by ID (Admin / Superuser only).
 *
 * @param {string} id - User ID
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function getUserById(id, options = {}) {
  return get(`/users/${encodeURIComponent(id)}`, options);
}

/**
 * Create a new user (Admin / Superuser only).
 *
 * @param {Object} userData - User creation data
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function createUser(userData, options = {}) {
  return post('/users', userData, options);
}

/**
 * Replace / update user details by ID via PUT (Admin / Superuser only).
 *
 * @param {string} id - User ID
 * @param {Object} userData - User update data
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function updateUser(id, userData, options = {}) {
  return put(`/users/${encodeURIComponent(id)}`, userData, options);
}

/**
 * Partially update user details by ID via PATCH (Admin / Superuser only).
 *
 * @param {string} id - User ID
 * @param {Object} userData - User update patch data
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function patchUser(id, userData, options = {}) {
  return patch(`/users/${encodeURIComponent(id)}`, userData, options);
}

/**
 * Delete a user by ID (Admin / Superuser only).
 *
 * @param {string} id - User ID
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function deleteUser(id, options = {}) {
  return del(`/users/${encodeURIComponent(id)}`, options);
}

const userService = {
  getProfile,
  updateProfile,
  uploadAvatar,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  patchUser,
  deleteUser,
};

export default userService;
