/**
 * ============================================================================
 * CLIENT NOTIFICATIONS HOOK (useClientNotifications.js)
 * ============================================================================
 * Role: Custom Data Hook (Client Portal)
 * Location: src/components/client/useClientNotifications.js
 *
 * Purpose:
 *   Loads the logged-in user's notifications for the bell in <ClientTopbar>
 *   (same idea as hooks/useAdminNotifications.js on the admin side):
 *     1. Reads the shared notifications list from the backend state store.
 *     2. Keeps only this user's items, newest first.
 *     3. Marks one or all items as read and saves the list back.
 *
 * Connected Backend Endpoints:
 *   - GET /api/state/notifications -> every notification in the system
 *     (the backend adds one for the client whenever a vendor approves,
 *      rejects, starts or completes their event — see EventsService.notifyClient)
 *   - PUT /api/state/notifications -> saves the list after marking items read
 *
 * Returns:
 *   @returns {Object} { notifications, unreadCount, markRead, markAllRead }
 * ============================================================================
 */

import { useEffect, useState } from "react";
import { getStateKey, setStateKey } from "../../services/stateService";
import { getCurrentUser, REFRESH_MS } from "../../utils/clientHelpers";

export function useClientNotifications() {
  const user = getCurrentUser();

  // The whole shared list (we need all of it to save it back)
  const [allNotifications, setAllNotifications] = useState([]);

  // Load now and every REFRESH_MS, so a vendor's approval lights up the bell
  // without the client reloading the page
  useEffect(() => {
    let isMounted = true;
    const load = () =>
      getStateKey("notifications")
        .then((list) => {
          if (isMounted) setAllNotifications(Array.isArray(list) ? list : []);
        })
        .catch(() => {
          // The bell is never worth an error banner — just show nothing
        });
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  // Only this user's notifications, newest first
  const notifications = allNotifications
    .filter((n) => n.userId === user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Marks the given ids as read on screen, then saves to the backend
  const markRead = async (ids) => {
    const updated = allNotifications.map((n) => (ids.includes(n.id) ? { ...n, isRead: true } : n));
    setAllNotifications(updated);
    try {
      await setStateKey("notifications", updated);
    } catch {
      // Not critical: the badge has already updated on screen
    }
  };

  const markAllRead = () => markRead(notifications.map((n) => n.id));

  return { notifications, unreadCount, markRead, markAllRead };
}

export default useClientNotifications;
