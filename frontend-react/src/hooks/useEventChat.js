/**
 * ============================================================================
 * EVENT CHAT HOOK (useEventChat.js)
 * ============================================================================
 * Role: Shared Custom Hook (Client Messages + Vendor Event Coordination)
 * Location: src/hooks/useEventChat.js
 *
 * Purpose:
 *   The client <-> vendor chat. Both portals read and write the SAME message
 *   list, so a client's message appears on the vendor's page and vice versa:
 *     1. Loads the user's live events (getMyEvents filters by role: the client
 *        gets their events, the vendor gets the events assigned to them).
 *     2. Loads the shared messages + issues, refreshing every 3 seconds.
 *     3. Builds the selected event's chat: saved messages plus that event's
 *        issues shown as system lines (unless already posted into the chat).
 *     4. sendMessage(): re-reads the newest list, appends, saves it back.
 *
 * Connected Backend Endpoints:
 *   - GET /api/events                         -> live events for this user
 *   - GET /api/issues                         -> issues shown inside the chat
 *   - GET/PUT /api/state/coordinationMessages -> the shared message list
 *
 * Returns:
 *   @returns {Object} { user, error, setError, visibleEvents, selectedEvent, selectedId,
 *                       setSelectedId, search, setSearch, messages, findIssue, sendMessage }
 * ============================================================================
 */

import { useEffect, useState } from "react";
import { getMyEvents } from "../services/eventService";
import { getIssues } from "../services/issueService";
import { getStateKey, setStateKey } from "../services/stateService";
import { describeError, getCurrentUser, initials } from "../utils/clientHelpers";

const CHAT_REFRESH_MS = 3000;
const MESSAGES_KEY = "coordinationMessages";

export function useEventChat() {
  const user = getCurrentUser();

  const [events, setEvents] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [allMessages, setAllMessages] = useState([]);
  const [issues, setIssues] = useState([]);
  const [error, setError] = useState(null);

  // --------------------------------------------------------------------------
  // 1. LOAD + POLL
  // --------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [myEvents, messages, allIssues] = await Promise.all([
          getMyEvents(),
          getStateKey(MESSAGES_KEY),
          getIssues(),
        ]);
        if (!isMounted) return;
        const live = myEvents.filter((e) => e.status === "live");
        setEvents(live);
        // Select the first live event the first time we load
        setSelectedId((current) => current || live[0]?.id || null);
        setAllMessages(Array.isArray(messages) ? messages : []);
        setIssues(allIssues || []);
        setError(null);
      } catch (err) {
        if (isMounted) setError(describeError(err, "messages"));
      }
    }
    loadData();
    const timer = setInterval(loadData, CHAT_REFRESH_MS);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  // --------------------------------------------------------------------------
  // 2. DERIVED LISTS
  // --------------------------------------------------------------------------
  const selectedEvent = events.find((e) => e.id === selectedId) || null;
  const visibleEvents = events.filter((e) => e.name.toLowerCase().includes(search.trim().toLowerCase()));

  // Selected chat = saved messages + issues not already posted as messages
  const saved = allMessages.filter((m) => m.eventId === selectedId);
  const issueLines = issues
    .filter((iss) => (iss.eventId === selectedId || iss.event === selectedId) && iss.title)
    .filter((iss) => !saved.some((m) => m.issueId === iss.id))
    .map((iss) => ({
      id: "ISS_" + iss.id,
      type: "issue",
      issueId: iss.id,
      text: `${iss.title}${iss.desc || iss.description ? " — " + (iss.desc || iss.description) : ""}`,
      createdAt: iss.createdAt,
    }));
  const messages = [...saved, ...issueLines].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const findIssue = (issueId) => issues.find((i) => i.id === issueId) || null;

  // --------------------------------------------------------------------------
  // 3. SEND  (returns true when saved)
  // FACULTY MAY ASK: Why re-read the list before saving?
  // HOW TO CHANGE: The chat is stored as one array; reading the newest copy first
  // means we don't overwrite a message the other side sent a moment ago.
  // --------------------------------------------------------------------------
  const sendMessage = async (text) => {
    if (!selectedId) return false;
    try {
      const message = {
        id: "MSG_" + Date.now(),
        eventId: selectedId,
        channel: user.role, // "client" or "vendor" — who wrote it
        sender: user.name,
        senderRole: user.roleLabel,
        senderInitials: initials(user.name),
        text,
        type: "message",
        createdAt: new Date().toISOString(),
      };
      const latest = (await getStateKey(MESSAGES_KEY)) || [];
      const updated = [...latest, message];
      await setStateKey(MESSAGES_KEY, updated);
      setAllMessages(updated);
      return true;
    } catch {
      setError("Message not sent. Please try again.");
      return false;
    }
  };

  return {
    user, error, setError,
    visibleEvents, selectedEvent, selectedId, setSelectedId, search, setSearch,
    messages, findIssue, sendMessage,
  };
}

export default useEventChat;
