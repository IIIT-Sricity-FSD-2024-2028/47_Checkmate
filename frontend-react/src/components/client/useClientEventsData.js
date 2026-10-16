/**
 * ============================================================================
 * CLIENT EVENTS DATA HOOK (useClientEventsData.js)
 * ============================================================================
 * Role: Custom Data Retrieval Hook (Client "My Events" page)
 * Location: src/components/client/useClientEventsData.js
 *
 * Purpose:
 *   Encapsulates all data fetching, filtering and KPI maths for My Events:
 *     1. Loads this client's events with `getMyEvents()` and re-fetches every
 *        REFRESH_MS so status changes made by the vendor show up live.
 *     2. Computes summary KPI metrics (Total, Pending, Approved, Live).
 *     3. Filters by search text (name, ID, type, status, venue), status and type.
 *     4. Resets all filters in one call.
 *
 * Connected Backend Endpoints:
 *   - GET /api/events (via getMyEvents) -> events filtered to this client
 *
 * Returns:
 *   @returns {Object} {
 *     events, filteredEvents, loading, error, stats,
 *     searchTerm, setSearchTerm, statusFilter, setStatusFilter,
 *     typeFilter, setTypeFilter, handleResetFilters
 *   }
 * ============================================================================
 */

import { useEffect, useMemo, useState } from "react";
import { getMyEvents } from "../../services/eventService";
import { describeError, REFRESH_MS } from "../../utils/clientHelpers";

export function useClientEventsData() {
  // --------------------------------------------------------------------------
  // 1. STATE DEFINITIONS
  // --------------------------------------------------------------------------
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search box + dropdown filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  // --------------------------------------------------------------------------
  // 2. DATA FETCH + AUTO REFRESH EFFECT
  // --------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    async function loadEvents() {
      try {
        const data = await getMyEvents();
        if (!isMounted) return;
        setEvents(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        if (isMounted) setError(describeError(err, "your events"));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadEvents();
    const timer = setInterval(loadEvents, REFRESH_MS);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  // --------------------------------------------------------------------------
  // 3. KPI SUMMARY METRICS
  // FACULTY MAY ASK: What does useMemo do here?
  // HOW TO CHANGE: It only recalculates when `events` changes, not on every
  // keystroke in the search box.
  // --------------------------------------------------------------------------
  const stats = useMemo(() => ({
    total: events.length,
    pending: events.filter((e) => e.status === "pending").length,
    approved: events.filter((e) => ["confirmed", "approved"].includes(e.status)).length,
    live: events.filter((e) => e.status === "live").length,
  }), [events]);

  // --------------------------------------------------------------------------
  // 4. SEARCH + FILTERS
  // FACULTY MAY ASK: Which fields does the search look at?
  // HOW TO CHANGE: Add or remove fields in the array below.
  // --------------------------------------------------------------------------
  const filteredEvents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return events.filter((ev) => {
      const matchesSearch = !query || [ev.name, ev.id, ev.type, ev.status, ev.venue]
        .some((field) => String(field || "").toLowerCase().includes(query));

      // "approved" in the dropdown also covers "confirmed"
      const status = ev.status === "confirmed" ? "approved" : ev.status;
      const matchesStatus = statusFilter === "All" || status === statusFilter;

      const matchesType = typeFilter === "All" || String(ev.type || "").toLowerCase() === typeFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [events, searchTerm, statusFilter, typeFilter]);

  // --------------------------------------------------------------------------
  // 5. RESET ALL FILTERS
  // --------------------------------------------------------------------------
  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setTypeFilter("All");
  };

  return {
    events,
    filteredEvents,
    loading,
    error,
    stats,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    handleResetFilters,
  };
}

export default useClientEventsData;
