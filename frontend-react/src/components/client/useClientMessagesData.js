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
 *   - GET/POST /api/admin-chat -> admin support messages (live)
 * ============================================================================
 */

import useEventChat from "../../hooks/useEventChat";
import { useLiveChat } from "../../hooks/useLiveChat";


export function useClientMessagesData() {
  // Event chat (shared with the vendor side)
  const eventChat = useEventChat();
  const { user, setError } = eventChat;

  // Admin support chat: GET/POST /api/admin-chat, delivered live (useLiveChat)
  const admin = useLiveChat({ kind: "admin" });
  const adminChat = [...admin.messages].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const sendAdminMessage = async (text) => {
    const ok = await admin.send(text);
    if (!ok) setError("Message not sent. Please try again.");
    return ok;
  };

  return { ...eventChat, adminChat, sendAdminMessage };
}

export default useClientMessagesData;
