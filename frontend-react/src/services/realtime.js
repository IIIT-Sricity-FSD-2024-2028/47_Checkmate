/**
 * ============================================================================
 * REALTIME SOCKET (services/realtime.js)
 * ============================================================================
 * One Socket.IO connection per browser tab, opened after login with the JWT.
 * The backend (modules/messages/messages.gateway.ts) checks the token and only
 * pushes events meant for this user:
 *   - "message:new"     { threadId, message }  event chats (client/vendor/staff)
 *   - "admin-chat:new"  message                admin support chat
 * Pages never SEND over the socket; sending stays a normal POST request.
 * If the socket is down, useLiveChat polls every 3 seconds instead.
 * ============================================================================
 */

import { io } from "socket.io-client";
import { getBaseUrl } from "./apiClient";
import { getAuthToken } from "./auth/authStorage";

let socket = null;
let socketToken = null;

/** The shared socket (created on first use; re-created after a new login). */
export function getSocket() {
  const token = getAuthToken();
  if (!token) return null;
  if (socket && socketToken === token) return socket;
  if (socket) socket.disconnect();
  // "http://localhost:3000/api" -> "http://localhost:3000"
  const origin = getBaseUrl().replace(/\/api\/?$/, "");
  socket = io(origin, { auth: { token }, transports: ["websocket", "polling"] });
  socketToken = token;
  return socket;
}

/** True while the socket is connected (used to switch polling off). */
export function isRealtimeConnected() {
  return Boolean(socket && socket.connected);
}

/** Listen to one socket event; returns a function that stops listening. */
export function onRealtime(event, handler) {
  const s = getSocket();
  if (!s) return () => {};
  s.on(event, handler);
  return () => s.off(event, handler);
}

/** Closes the socket (called on logout). */
export function closeRealtime() {
  if (socket) socket.disconnect();
  socket = null;
  socketToken = null;
}
