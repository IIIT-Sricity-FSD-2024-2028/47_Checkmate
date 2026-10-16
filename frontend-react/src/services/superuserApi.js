/**
 * superuserApi.js - Data access client for EventPro Superuser module
 * Handles asynchronous REST communication with the NestJS backend
 *
 * ENDPOINTS USED:
 *   - GET  /api/analytics/summary
 *   - GET  /api/analytics/financial-summary
 *   - GET  /api/snapshot
 *   - CRUD /api/users
 *   - CRUD /api/events
 *   - CRUD /api/resources
 *   - CRUD /api/staff
 *   - CRUD /api/bookings
 *   - GET  /api/bookings/commissions
 *   - GET  /api/vendors
 */

const API_BASE =
  (typeof window !== 'undefined' && window.CHECKMATE_API_BASE) ||
  'http://localhost:3000/api';

/**
 * Retrieves the current logged-in superuser session details
 * Reads checkmate_session from sessionStorage or localStorage
 */
export function getSessionUser() {
  try {
    const raw =
      sessionStorage.getItem('checkmate_session') ||
      localStorage.getItem('checkmate_session');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        name: parsed.user?.name || parsed.user || parsed.name || 'Super Admin',
        email: (parsed.user?.email || parsed.email || 'superuser@demo.com').toLowerCase(),
        role: parsed.role || 'superuser',
        token: parsed.token || null,
      };
    }
  } catch {
    // Fall back to default superuser credentials
  }
  return {
    name: 'Super Admin',
    email: 'superuser@demo.com',
    role: 'superuser',
    token: null,
  };
}

/**
 * Builds HTTP headers including authentication token and superuser role header
 */
export function getAuthHeaders() {
  const session = getSessionUser();
  const headers = {
    'Content-Type': 'application/json',
    'x-role': 'superuser',
  };
  if (session.token) {
    headers['Authorization'] = `Bearer ${session.token}`;
  }
  return headers;
}

/**
 * Generic fetch wrapper with error handling and JSON parsing
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}/${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let errorDetails = '';
    try {
      const errJson = await response.json();
      errorDetails = errJson.message || JSON.stringify(errJson);
    } catch {
      errorDetails = response.statusText;
    }
    throw new Error(`API Error [${response.status}] ${endpoint}: ${errorDetails}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

/* ── Analytics & System Overview ────────────────────────────── */

export async function fetchAnalyticsSummary() {
  return request('analytics/summary');
}

export async function fetchFinancialSummary() {
  return request('analytics/financial-summary');
}

export async function fetchSnapshot() {
  return request('snapshot');
}

/* ── Users Management ────────────────────────────────────────── */

export async function fetchUsers() {
  return request('users');
}

export async function createUser(payload) {
  return request('users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateUser(id, payload) {
  return request(`users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteUser(id) {
  return request(`users/${id}`, {
    method: 'DELETE',
  });
}

/* ── Events Management ───────────────────────────────────────── */

export async function fetchEvents() {
  return request('events');
}

export async function createEvent(payload) {
  return request('events', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateEvent(id, payload) {
  return request(`events/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteEvent(id) {
  return request(`events/${id}`, {
    method: 'DELETE',
  });
}

/* ── Bookings & Commissions ─────────────────────────────────── */

export async function fetchBookings() {
  return request('bookings');
}

export async function fetchBookingCommissions() {
  return request('bookings/commissions');
}

export async function createBooking(payload) {
  return request('bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateBooking(id, payload) {
  return request(`bookings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteBooking(id) {
  return request(`bookings/${id}`, {
    method: 'DELETE',
  });
}

/* ── Resources Management ────────────────────────────────────── */

export async function fetchResources() {
  return request('resources');
}

export async function createResource(payload) {
  return request('resources', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateResource(id, payload) {
  return request(`resources/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteResource(id) {
  return request(`resources/${id}`, {
    method: 'DELETE',
  });
}

/* ── Staff Management ────────────────────────────────────────── */

export async function fetchStaff() {
  return request('staff');
}

export async function createStaff(payload) {
  return request('staff', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateStaff(id, payload) {
  return request(`staff/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteStaff(id) {
  return request(`staff/${id}`, {
    method: 'DELETE',
  });
}

/* ── Vendors Management ──────────────────────────────────────── */

export async function fetchVendors() {
  return request('vendors');
}

/* ── Formatting Helpers ──────────────────────────────────────── */

/**
 * Formats a raw number into a neat dollar string: $2.4M, $25,000, $500
 */
export function formatCurrency(amount) {
  const n = Number(amount) || 0;
  if (n >= 1000000) {
    return `$${(n / 1000000).toFixed(1)}M`;
  }
  if (n >= 1000) {
    return `$${n.toLocaleString()}`;
  }
  return `$${n}`;
}

/**
 * Formats standard date strings into readable MM/DD/YYYY format
 */
export function normalizeDate(value) {
  if (!value) return '';
  if (String(value).includes('/')) return value;
  const parts = String(value).split('T')[0].split('-');
  if (parts.length === 3) {
    return `${Number(parts[1])}/${Number(parts[2])}/${parts[0]}`;
  }
  return value;
}
