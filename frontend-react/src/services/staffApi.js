/**
 * staffApi.js - Data access helper for EventPro Staff module
 * Handles async REST API communication with the backend
 */

const API_BASE = (typeof window !== 'undefined' && window.CHECKMATE_API_BASE) || 'http://localhost:3000/api';

export function getSessionUser() {
  try {
    const raw = sessionStorage.getItem('checkmate_session') || localStorage.getItem('checkmate_session');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        name: parsed.user || parsed.name || 'Mike Staff',
        email: (parsed.email || 'staff@demo.com').toLowerCase(),
        role: parsed.role || 'Staff',
        token: parsed.token || null,
        staffId: parsed.staffId || null,
      };
    }
  } catch {
    // Fall back to demo user
  }
  return {
    name: 'Mike Staff',
    email: 'staff@demo.com',
    role: 'Staff',
    token: null,
    staffId: null,
  };
}

export function getAuthHeaders() {
  const session = getSessionUser();
  const headers = {
    'Content-Type': 'application/json',
    'x-role': 'staff',
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
