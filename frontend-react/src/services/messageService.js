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

const messageService = {
  getMessages,
  getThreads,
  getMessageThread,
  createMessage,
  sendMessage,
};

export default messageService;
