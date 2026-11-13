/**
 * staffApi.js - Data access helper for EventPro Staff module
 * Handles async REST API communication with the backend
 */

import { getAuthSession, getAuthToken, getAuthRole, getAuthEmail } from './auth/authStorage';
import { getBaseUrl } from './apiClient';

const API_BASE = getBaseUrl();

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

/** Reports how the signed-in staff member is getting on with a live event. */
export async function updateStaffProgress(id, progress) {
  const response = await fetch(`${API_BASE}/staff-assignments/${encodeURIComponent(id)}/progress`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(progress),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || 'Could not send your update.');
  return data;
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

export async function fetchMessageThread(threadId) {
  const response = await fetch(`${API_BASE}/messages/${encodeURIComponent(threadId)}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    if (response.status === 404) return [];
    throw new Error(`Failed to load messages for thread ${threadId}: ${response.status}`);
  }
  return response.json();
}

export async function sendMessage(messageData) {
  const response = await fetch(`${API_BASE}/messages`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(messageData),
  });
  if (!response.ok) {
    throw new Error(`Failed to send message: ${response.status}`);
  }
  return response.json();
}

export async function createStaffRequest(requestData) {
  const session = getSessionUser();
  const payload = {
    title: requestData.title || `Dispatch Request: ${requestData.item || 'Resource'}`,
    description: requestData.desc || requestData.description || `Staff requested ${requestData.qty || 1}x ${requestData.item}`,
    desc: requestData.desc || requestData.description || `Staff requested ${requestData.qty || 1}x ${requestData.item}`,
    category: 'Staff Request',
    type: 'staff_request',
    priority: requestData.priority || 'High',
    eventId: requestData.eventId || null,
    event: requestData.eventId || null,
    reporter: session.name,
    reporterRole: 'Staff',
    email: session.email,
    role: 'Staff',
    status: 'open',
    severity: 'high',
    createdAt: new Date().toISOString(),
  };

  const issueResult = await createIssue(payload);

  // Also post an event coordination message to the thread so vendor chat displays the request
  if (requestData.eventId) {
    try {
      await sendMessage({
        threadId: requestData.eventId,
        sender: session.name,
        initials: (session.name || 'Staff')
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase(),
        self: true,
        text: `📋 Dispatch Request: ${requestData.qty || 1}x ${requestData.item} (${requestData.type || 'resource'})${
          requestData.desc ? ' — "' + requestData.desc + '"' : ''
        }`,
        avatar: 'pink',
      });
    } catch {
      // Non-fatal if thread not yet seeded
    }
  }

  return issueResult;
}

// ── Admin Coordination chat (shared state key "adminChatMessages") ──
// The same list is read by the admin Coordination Hub and Issue Tracking pages.

// Loads the whole admin support chat list
export async function fetchAdminChat() {
  const response = await fetch(`${API_BASE}/state/adminChatMessages`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Failed to load admin chat: ${response.status}`);
  }
  const list = await response.json();
  return Array.isArray(list) ? list : [];
}

// Adds one message to the admin support chat. It re-reads the latest list
// first so messages sent by others in the meantime are not overwritten.
export async function postAdminChatMessage(message) {
  const latest = await fetchAdminChat();
  const updated = [...latest, message];
  const response = await fetch(`${API_BASE}/state/adminChatMessages`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ value: updated }),
  });
  if (!response.ok) {
    throw new Error(`Failed to send message: ${response.status}`);
  }
  return updated;
}
