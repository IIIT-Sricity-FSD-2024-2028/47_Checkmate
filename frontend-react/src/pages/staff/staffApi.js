/**
 * staffApi.js - Data access helper for EventPro Staff module
 * Handles async REST API communication with the backend
 */

import { getAuthSession, getAuthToken, getAuthRole, getAuthEmail } from '../../services/auth/authStorage';

const API_BASE = (typeof window !== 'undefined' && window.CHECKMATE_API_BASE) || 'http://localhost:3000/api';

export function getSessionUser() {
  const session = getAuthSession();
  const user = session?.user || (typeof session?.user === 'object' && session.user !== null ? session.user : {});
  const directName = typeof session?.name === 'string' ? session.name : null;
  const userName = typeof user?.name === 'string' ? user.name : null;
  const userStaffId = user?.staffId || session?.staffId || null;
  const userEmail = getAuthEmail() || user?.email || session?.email || 'mike.staff@eliteevents.com';
  const userRole = getAuthRole() || session?.role || user?.role || 'Staff';
  const token = getAuthToken() || session?.token || null;

  return {
    name: userName || directName || 'Mike Johnson',
    email: String(userEmail).toLowerCase(),
    role: userRole,
    token: token,
    staffId: userStaffId || 'S001',
    userId: user?.id || session?.userId || null,
  };
}

export function getAuthHeaders() {
  const session = getSessionUser();
  const headers = {
    'Content-Type': 'application/json',
    'x-role': 'staff',
    'x-email': session.email,
  };
  if (session.token) {
    headers['Authorization'] = `Bearer ${session.token}`;
  }
  return headers;
}

export async function fetchStaffAssignments() {
  const response = await fetch(`${API_BASE}/staff-assignments`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Failed to load staff assignments: ${response.status}`);
  }
  return response.json();
}

export async function updateStaffAssignment(id, patch) {
  const response = await fetch(`${API_BASE}/staff-assignments/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(patch),
  });
  if (!response.ok) {
    throw new Error(`Failed to update assignment: ${response.status}`);
  }
  return response.json();
}

export async function fetchStaffList() {
  const response = await fetch(`${API_BASE}/staff`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Failed to load staff list: ${response.status}`);
  }
  return response.json();
}

export async function updateStaffMember(id, patch) {
  const response = await fetch(`${API_BASE}/staff/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(patch),
  });
  if (!response.ok) {
    throw new Error(`Failed to update staff member: ${response.status}`);
  }
  return response.json();
}

export async function fetchEvents() {
  const response = await fetch(`${API_BASE}/events`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Failed to load events: ${response.status}`);
  }
  return response.json();
}

export async function fetchIssues() {
  const response = await fetch(`${API_BASE}/issues`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Failed to load issues: ${response.status}`);
  }
  return response.json();
}

export async function createIssue(data) {
  const response = await fetch(`${API_BASE}/issues`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Failed to submit issue: ${response.status}`);
  }
  return response.json();
}
