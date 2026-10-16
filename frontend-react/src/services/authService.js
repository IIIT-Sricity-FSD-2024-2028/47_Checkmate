import { post } from './apiClient';
import {
  clearAuthSession,
  getAuthEmail,
  getAuthRole,
  getAuthSession,
  getAuthToken,
  getAuthUser,
  saveAuthSession,
} from './auth/authStorage';

/**
 * Authenticate existing users (Client, Vendor, Admin, Superuser).
 * Supports both login({ email, password }) and login(email, password).
 *
 * @param {Object|string} credentialsOrEmail - Credentials object or email string
 * @param {string} [password] - Password if first param was email
 * @param {Object} [options] - Additional request options
 * @returns {Promise<{ user: Object, role: string, token: string }>}
 */
export async function login(credentialsOrEmail, password, options = {}) {
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

  return post('/auth/login', credentials, {
    ...requestOptions,
    isPublic: true,
  });
}

/**
 * Register a new user account.
 *
 * @param {Object} userData - { name, email, phone?, role, password }
 * @param {Object} [options] - Additional request options
 * @returns {Promise<{ user: Object, role: string, token: string }>}
 */
export async function register(userData, options = {}) {
  return post('/auth/register', userData, {
    ...options,
    isPublic: true,
  });
}

/**
 * Log in via the dedicated staff authentication endpoint.
 *
 * @param {Object|string} credentialsOrEmail - Credentials object or email string
 * @param {string} [password] - Password if first param was email
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
 * Sign up a new staff member via the dedicated staff registration endpoint.
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
 * Clear the current client-side auth session.
 */
export function logout() {
  clearAuthSession();
}

// Re-export storage helpers for convenient unified access
export {
  saveAuthSession,
  getAuthSession,
  clearAuthSession,
  getAuthToken,
  getAuthRole,
  getAuthEmail,
  getAuthUser,
};

const authService = {
  login,
  register,
  staffLogin,
  staffSignup,
  logout,
  saveAuthSession,
  getAuthSession,
  clearAuthSession,
  getAuthToken,
  getAuthRole,
  getAuthEmail,
  getAuthUser,
};

export default authService;
