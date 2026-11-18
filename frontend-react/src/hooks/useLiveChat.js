/**
 * ============================================================================
 * LIVE CHAT HOOK (hooks/useLiveChat.js)
 * ============================================================================
 * One conversation, delivered live:
 *   kind "thread": an event chat (threadId "client-EVT001" or "staff-EVT001")
 *   kind "admin":  the admin support chat. A normal user gets their own
 *                  conversation; an admin passes `withEmail` to open one person's.
 *
 * How messages arrive:
 *   1. Loaded once when the conversation opens.
 *   2. Pushed by the socket (services/realtime.js) the moment someone sends one.
 *   3. If the socket is not connected, the conversation is re-loaded every
 *      3 seconds instead (fallback), so nothing is ever missed.
 * Opening a conversation (and every new message while it is open) marks it as
 * read on the server, which is what the unread badges count.
 *
 * Returns { messages, error, send(text) -> true/false, connected }
 * ============================================================================
 */

import { useEffect, useState } from "react";
import { getAdminChat, getMessageThread, markThreadRead, postAdminChat, sendMessage } from "../services/messageService";
import { isRealtimeConnected, onRealtime } from "../services/realtime";

const FALLBACK_POLL_MS = 3000;

// Marks a conversation read on the server, then tells useUnreadCounts to recount
// (a plain browser event, so the badge hook does not need to know about chats)
function markRead(readKey) {
  markThreadRead(readKey)
    .then(() => window.dispatchEvent(new Event("chat:read")))
    .catch(() => {});
}

// "10:42 AM" for today, "18 Nov, 10:42 AM" for older messages
export function formatMessageTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return date.toDateString() === new Date().toDateString()
    ? time
    : `${date.toLocaleDateString([], { day: "numeric", month: "short" })}, ${time}`;
}

// Is an admin-chat message part of the conversation with `email`?
const inConversation = (m, email) => {
  const e = String(email || "").toLowerCase();
  return String(m.senderEmail || "").toLowerCase() === e || String(m.recipientEmail || "").toLowerCase() === e;
};

// Adds messages that are not on the list yet (the socket and our own POST can both deliver one)
const mergeMessages = (list, incoming) => {
  const ids = new Set(list.map((m) => m.id));
  const fresh = incoming.filter((m) => m && !ids.has(m.id));
  return fresh.length ? [...list, ...fresh] : list;
};

export function useLiveChat({ kind = "thread", threadId = null, withEmail = null }) {
  // Which conversation the stored messages belong to (avoids showing stale ones)
  const key = kind === "admin" ? `admin:${withEmail || "me"}` : threadId;

  // Messages of the open conversation
  const [loaded, setLoaded] = useState({ key: null, messages: [] });

  // Error text from loading or sending
  const [error, setError] = useState(null);

  // Whether live delivery is on (shown as "Live" / "Polling" on some pages)
  const [connected, setConnected] = useState(isRealtimeConnected());

  // The read-marker name the server uses for this conversation
  const readKey = kind === "admin" ? (withEmail ? `admin-chat:${withEmail.toLowerCase()}` : "admin-chat") : threadId;

  // Load + live updates + fallback polling for the open conversation
  useEffect(() => {
    if (!key || (kind === "thread" && !threadId)) return undefined;
    let isMounted = true;

    async function load() {
      try {
        let list = kind === "admin" ? await getAdminChat() : await getMessageThread(threadId);
        list = Array.isArray(list) ? list : [];
        if (kind === "admin" && withEmail) list = list.filter((m) => inConversation(m, withEmail));
        if (isMounted) {
          setLoaded({ key, messages: list });
          setError(null);
        }
      } catch (err) {
        if (isMounted) setError(err.message || "Could not load messages.");
      }
    }

    // A pushed message for THIS conversation is added straight away
    function onIncoming(message) {
      if (!isMounted || !message) return;
      setLoaded((prev) => (prev.key === key ? { key, messages: mergeMessages(prev.messages, [message]) } : prev));
      markRead(readKey);
    }

    load();
    markRead(readKey);

    const stopThread = onRealtime("message:new", (payload) => {
      if (kind === "thread" && payload?.threadId === threadId) onIncoming(payload.message);
    });
    const stopAdmin = onRealtime("admin-chat:new", (message) => {
      if (kind === "admin" && (!withEmail || inConversation(message, withEmail))) onIncoming(message);
    });
    const stopConnect = onRealtime("connect", () => isMounted && setConnected(true));
    const stopDisconnect = onRealtime("disconnect", () => isMounted && setConnected(false));
    // The socket may have connected before we started listening
    setConnected(isRealtimeConnected());

    // Fallback: poll only while the socket is down
    const timer = setInterval(() => {
      setConnected(isRealtimeConnected());
      if (!isRealtimeConnected()) load();
    }, FALLBACK_POLL_MS);

    return () => {
      isMounted = false;
      clearInterval(timer);
      stopThread();
      stopAdmin();
      stopConnect();
      stopDisconnect();
    };
  }, [key, kind, threadId, withEmail, readKey]);

  // Sends one message; returns true when the server saved it
  const send = async (text) => {
    const clean = String(text || "").trim();
    if (!clean) return false;
    try {
      const saved = kind === "admin"
        ? await postAdminChat({ text: clean, recipientEmail: withEmail || undefined })
        : await sendMessage({ threadId, text: clean });
      setLoaded((prev) => (prev.key === key ? { key, messages: mergeMessages(prev.messages, [saved]) } : prev));
      return true;
    } catch (err) {
      setError(err.message || "Message not sent. Please try again.");
      return false;
    }
  };

  const messages = loaded.key === key ? loaded.messages : [];
  return { messages, error, send, connected };
}

export default useLiveChat;
