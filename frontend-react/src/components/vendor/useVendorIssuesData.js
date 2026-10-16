/**
 * ============================================================================
 * VENDOR ISSUE INBOX DATA HOOK (useVendorIssuesData.js)
 * ============================================================================
 * Role: Custom Data Retrieval & Mutation Hook (Vendor Client Issues page)
 * Location: src/components/vendor/useVendorIssuesData.js
 *
 * Purpose:
 *   Client <-> vendor bridge: issues raised on this vendor's events (by clients
 *   or staff) land here so the vendor can act on them.
 *     1. Loads the vendor's events and all issues; keeps issues whose event
 *        belongs to this vendor (issues sent to the admins are left out).
 *     2. Search (title, reporter, event) + status filter.
 *     3. Changes an issue's status (open -> in progress -> resolved).
 *        The client sees the new status in "View Report" on their Messages page.
 *     4. Refreshes every 10 seconds so new reports appear on their own.
 *
 * Connected Backend Endpoints:
 *   - GET   /api/events      -> the vendor's events (getMyEvents)
 *   - GET   /api/issues      -> all issues
 *   - PATCH /api/issues/:id  -> updates the status
 * ============================================================================
 */

import { useEffect, useMemo, useState } from "react";
import { getMyEvents } from "../../services/eventService";
import { getIssues, patchIssue } from "../../services/issueService";

const REFRESH_MS = 10000;

// "In Progress", "in_progress", "Open" -> "in_progress", "open"
export function normalizeStatus(status) {
  return String(status || "open").toLowerCase().replace(/\s+/g, "_");
}

export function useVendorIssuesData() {
  const [events, setEvents] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [toast, setToast] = useState(null);

  // --------------------------------------------------------------------------
  // 1. LOAD + POLL
  // --------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [myEvents, allIssues] = await Promise.all([getMyEvents(), getIssues()]);
        if (!isMounted) return;
        setEvents(Array.isArray(myEvents) ? myEvents : []);
        setIssues(Array.isArray(allIssues) ? allIssues : []);
      } catch (err) {
        console.error("Failed to load client issues:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    const timer = setInterval(loadData, REFRESH_MS);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  // --------------------------------------------------------------------------
  // 2. ONLY ISSUES ON MY EVENTS (not the ones sent to admins)
  // --------------------------------------------------------------------------
  const inbox = useMemo(() => {
    const eventNames = {};
    events.forEach((e) => { eventNames[e.id] = e.name; });

    return issues
      .filter((iss) => iss.target !== "admin")
      .filter((iss) => eventNames[iss.eventId] || eventNames[iss.event])
      .map((iss) => ({ ...iss, eventName: eventNames[iss.eventId] || eventNames[iss.event] }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [events, issues]);

  // --------------------------------------------------------------------------
  // 3. SEARCH + STATUS FILTER
  // --------------------------------------------------------------------------
  const filteredIssues = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return inbox.filter((iss) => {
      const matchesSearch = !query ||
        [iss.title, iss.reporter, iss.eventName].some((t) => String(t || "").toLowerCase().includes(query));
      const matchesStatus = statusFilter === "All" || normalizeStatus(iss.status) === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [inbox, searchTerm, statusFilter]);

  const openCount = inbox.filter((iss) => normalizeStatus(iss.status) === "open").length;

  // --------------------------------------------------------------------------
  // 4. CHANGE STATUS
  // --------------------------------------------------------------------------
  const updateStatus = async (issueId, status) => {
    try {
      await patchIssue(issueId, { status });
      setIssues((prev) => prev.map((iss) => (iss.id === issueId ? { ...iss, status } : iss)));
      setToast({ type: "success", text: `Issue ${issueId} marked as ${status.replace("_", " ")}.` });
    } catch (err) {
      console.error("Failed to update issue:", err);
      setToast({ type: "danger", text: "Could not update the issue. Try again." });
    }
    setTimeout(() => setToast(null), 3000);
  };

  return {
    loading, filteredIssues, totalCount: inbox.length, openCount,
    searchTerm, setSearchTerm, statusFilter, setStatusFilter,
    updateStatus, toast, setToast,
  };
}

export default useVendorIssuesData;
