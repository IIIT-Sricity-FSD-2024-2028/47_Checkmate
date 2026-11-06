import { get, getBaseUrl, patch, post } from './apiClient';
import { getAuthToken } from './auth/authStorage';

/** The work on offer: one designation per approved vendor. */
export function getPublicDesignations() {
  return get('/public/staff-designations', { isPublic: true });
}

/** Submits an application. `formData` carries the fields and the documents. */
export function applyAsStaff(formData) {
  return post('/staff-applications', formData, { isPublic: true });
}

export function getStaffApplications() {
  return get('/staff-applications');
}

export function decideStaffApplication(id, status, note) {
  return patch(`/staff-applications/${encodeURIComponent(id)}/decision`, { status, note });
}

/** Documents need the sign-in token, so a plain link cannot open them. */
export async function downloadApplicationDocument(applicationId, doc) {
  const url = `${getBaseUrl()}/staff-applications/${encodeURIComponent(applicationId)}/documents/${encodeURIComponent(doc.id)}`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
  if (!response.ok) throw new Error('Could not open this document.');

  const link = document.createElement('a');
  link.href = URL.createObjectURL(await response.blob());
  link.download = doc.name;
  link.click();
  URL.revokeObjectURL(link.href);
}
