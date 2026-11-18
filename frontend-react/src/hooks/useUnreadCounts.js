/**
 * ============================================================================
 * UNREAD COUNTS HOOK (hooks/useUnreadCounts.js)
 * ============================================================================
 * How many messages the signed-in user has not read, per conversation:
 *   { threads: { "client-EVT001": 2, "admin-chat": 1 }, total: 3 }
 * Counted by the server (GET /api/messages/unread) from the time each
 * conversation was last opened. Re-counted when a message is pushed by the
 * socket, and every 3 seconds while the socket is down.
 * ============================================================================
 */

import { useCallback, useEffect, useState } from "react";
import { getUnreadCounts } from "../services/messageService";
import { isRealtimeConnected, onRealtime } from "../services/realtime";

const FALLBACK_POLL_MS = 3000;

export function useUnreadCounts() {
  // { threads: {...}, total }
  const [unread, setUnread] = useState({ threads: {}, total: 0 });

  // Asks the server for fresh counts
  const refresh = useCallback(async () => {
    try {
      const data = await getUnreadCounts();
      setUnread({ threads: data?.threads || {}, total: Number(data?.total || 0) });
    } catch {
      // keep the last counts
    }
  }, []);

  // Load now, then on every pushed message (slight delay so an open chat can mark it read first)
  useEffect(() => {
    refresh();
    const later = () => setTimeout(refresh, 400);
    const stopThread = onRealtime("message:new", later);
    const stopAdmin = onRealtime("admin-chat:new", later);
    const timer = setInterval(() => {
      if (!isRealtimeConnected()) refresh();
    }, FALLBACK_POLL_MS);
    // An open chat was just marked read (see useLiveChat) -> recount now
    window.addEventListener("chat:read", refresh);
    return () => {
      window.removeEventListener("chat:read", refresh);
      stopThread();
      stopAdmin();
      clearInterval(timer);
    };
  }, [refresh]);

  return { ...unread, refresh };
}

export default useUnreadCounts;
