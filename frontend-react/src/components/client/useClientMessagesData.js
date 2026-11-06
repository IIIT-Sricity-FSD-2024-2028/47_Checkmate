/**
 * ============================================================================
 * CLIENT MESSAGES DATA HOOK (useClientMessagesData.js)
 * ============================================================================
 * Role: Custom Data Hook (Client Messages page)
 * Location: src/components/client/useClientMessagesData.js
 *
 * Purpose:
 *   Combines the two chats on the client's Messages page:
 *     1. Event Chat  -> the shared `useEventChat()` hook (same data the vendor's
 *                       Event Coordination page uses, so both sides see each other).
 *     2. Admin Support -> this user's messages with the platform admins,
 *                         refreshed every 3 seconds.
 *
 * Connected Backend Endpoints:
 *   - everything in hooks/useEventChat.js
 *   - GET/PUT /api/state/adminChatMessages -> admin support messages
 * ============================================================================
 */

import { useEffect, useState } from "react";
import useEventChat from "../../hooks/useEventChat";
import { getStateKey, setStateKey } from "../../services/stateService";

const ADMIN_KEY = "adminChatMessages";
const CHAT_REFRESH_MS = 3000;

export function useClientMessagesData() {
  // Event chat (shared with the vendor side)
  const eventChat = useEventChat();
  const { user, setError } = eventChat;

  // Admin support chat
  const [adminMessages, setAdminMessages] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const load = () =>
      getStateKey(ADMIN_KEY)
        .then((list) => {
          if (isMounted) setAdminMessages(Array.isArray(list) ? list : []);
        })
        .catch(() => {});
    load();
    const timer = setInterval(load, CHAT_REFRESH_MS);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  // Messages I sent to the admins or that they sent to me
  const adminChat = adminMessages
    .filter((m) => m.senderEmail === user.email || m.recipientEmail === user.email)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const sendAdminMessage = async (text) => {
    try {
      const message = {
        id: "msg_" + Date.now(),
        sender: user.name,
        senderRole: user.roleLabel,
        senderEmail: user.email,
        text,
        timestamp: new Date().toISOString(),
        type: "message",
      };
      const latest = (await getStateKey(ADMIN_KEY)) || [];
      const updated = [...latest, message];
      await setStateKey(ADMIN_KEY, updated);
      setAdminMessages(updated);
      return true;
    } catch {
      setError("Message not sent. Please try again.");
      return false;
    }
  };

  return { ...eventChat, adminChat, sendAdminMessage };
}

export default useClientMessagesData;
