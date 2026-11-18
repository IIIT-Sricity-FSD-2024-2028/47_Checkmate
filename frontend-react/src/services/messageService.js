import { get, post } from './apiClient';

/**
 * Fetch all chat / coordination threads.
 *
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Array<Object>>}
 */
export async function getMessages(options = {}) {
  return get('/messages', options);
}

/**
 * Alias for getMessages() to clearly express retrieval of threads.
 *
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Array<Object>>}
 */
export async function getThreads(options = {}) {
  return getMessages(options);
}

/**
 * Fetch messages for a specific conversation thread.
 *
 * @param {string} threadId - Thread identifier (e.g., 'vendor-client')
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function getMessageThread(threadId, options = {}) {
  return get(`/messages/${encodeURIComponent(threadId)}`, options);
}

/**
 * Send / post a new message to a thread.
 *
 * @param {Object} messageData - { threadId, sender, initials, self, text, avatar? }
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function createMessage(messageData, options = {}) {
  return post('/messages', messageData, options);
}

/**
 * Alias for createMessage() to match common UI action naming.
 *
 * @param {Object} messageData - Message data
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>}
 */
export async function sendMessage(messageData, options = {}) {
  return createMessage(messageData, options);
}

/** Unread counts for the signed-in user: { threads: { threadId: n }, total } */
export async function getUnreadCounts(options = {}) {
  return get('/messages/unread', options);
}

/** Marks a conversation as read now ("admin-chat" or "admin-chat:<email>" for the admin chat). */
export async function markThreadRead(threadId, options = {}) {
  return post(`/messages/${encodeURIComponent(threadId)}/read`, {}, options);
}

/** The admin support chat: your own conversation (admins get all of them). */
export async function getAdminChat(options = {}) {
  return get('/admin-chat', options);
}

/** Posts one admin-chat message. Admins must pass recipientEmail (who the reply is for). */
export async function postAdminChat({ text, recipientEmail, type, issueId }, options = {}) {
  return post('/admin-chat', { text, recipientEmail, type, issueId }, options);
}

const messageService = {
  getMessages,
  getThreads,
  getMessageThread,
  createMessage,
  sendMessage,
  getUnreadCounts,
  markThreadRead,
  getAdminChat,
  postAdminChat,
};

export default messageService;
