import { del, get, post, put } from './apiClient';

// Global Settings. Anyone can read them (the sign-in page shows the maintenance
// notice); only admins and superusers can save them.
export async function getSettings() {
  return get('/settings', { isPublic: true });
}

export async function saveSettings(settings) {
  return put('/settings', settings);
}

// Announcements, shown in the banner at the top of every portal.
// The backend only returns the ones meant for the signed-in user's role.
export async function getAnnouncements() {
  return get('/announcements');
}

export async function createAnnouncement(announcement) {
  return post('/announcements', announcement);
}

export async function deleteAnnouncement(id) {
  return del(`/announcements/${encodeURIComponent(id)}`);
}

// An admin's reply in a client's support chat.
export async function replyToClient(recipientEmail, text) {
  return post('/support/replies', { recipientEmail, text });
}
