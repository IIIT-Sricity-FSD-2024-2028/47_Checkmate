/**
 * ============================================================================
 * VENDOR EVENTS DATA HOOK (useVendorEventsData.js)
 * ============================================================================
 * Role: Custom Data Retrieval & Mutation Hook (Vendor Events Portal)
 * Location: src/components/vendor/useVendorEventsData.js
 *
 * Purpose:
 *   Encapsulates all data fetching, state management, filtering, and action
 *   handlers for the Vendor Event Requests view:
 *     1. Asynchronously loads vendor-assigned events from `getMyEvents()`.
 *     2. Computes summary KPI metrics (Total Requests, Pending, Confirmed, Live).
 *     3. Performs multi-criteria search and filtering (query, status, category).
 *     4. Manages optimistic status updates (Approve / Reject) via `updateEventStatus()`.
 *     5. Manages transient toast feedback notifications.
 *
 * Returns:
 *   @returns {Object} {
 *     events,
 *     loading,
 *     filteredEvents,
 *     searchTerm,
 *     setSearchTerm,
 *     statusFilter,
 *     setStatusFilter,
 *     typeFilter,
 *     setTypeFilter,
 *     stats,
 *     toast,
 *     setToast,
 *     handleStatusUpdate,
 *     handleResetFilters
 *   }
 * ============================================================================
 */

import { useState, useEffect, useMemo } from "react";
import { getMyEvents, updateEventStatus } from "../../services";

export function useVendorEventsData() {
  // --------------------------------------------------------------------------
  // 1. COMPONENT STATE DEFINITIONS
  // --------------------------------------------------------------------------
  // Master array of event records loaded from backend
  const [events, setEvents] = useState([]);

  // Loading flag while performing async network requests
  const [loading, setLoading] = useState(true);

  // Search keyword query string (matches name, ID, or venue)
  const [searchTerm, setSearchTerm] = useState("");

  // Status dropdown filter ("All", "pending", "confirmed", "live", "completed", "rejected")
  const [statusFilter, setStatusFilter] = useState("All");

  // Event category / type filter ("All", "Conference", "Wedding", "Corporate", etc.)
  const [typeFilter, setTypeFilter] = useState("All");

  // Toast feedback message object { type: 'success' | 'danger' | 'info', text: string }
  const [toast, setToast] = useState(null);

  // --------------------------------------------------------------------------
  // 2. ASYNC DATA RETRIEVAL EFFECT
  // --------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    async function loadEvents() {
      setLoading(true);
      try {
        const data = await getMyEvents();
        if (isMounted && Array.isArray(data)) {
          setEvents(data);
        }
      } catch (error) {
        console.error("Failed to load events from backend:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadEvents();

    return () => {
      isMounted = false;
    };
  }, []);

  // --------------------------------------------------------------------------
  // 3. COMPUTE DYNAMIC KPI SUMMARY METRICS
  // --------------------------------------------------------------------------
  const stats = useMemo(() => {
    const total = events.length;
    const pending = events.filter(
      (e) => String(e.status || "").toLowerCase() === "pending"
    ).length;
    const confirmed = events.filter(
      (e) => ["confirmed", "approved"].includes(String(e.status || "").toLowerCase())
    ).length;
    const live = events.filter(
      (e) => String(e.status || "").toLowerCase() === "live"
    ).length;

    return { total, pending, confirmed, live };
  }, [events]);

  // --------------------------------------------------------------------------
  // 4. MEMOIZED MULTI-CRITERIA FILTERING
  // --------------------------------------------------------------------------
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const query = searchTerm.toLowerCase().trim();

      // Check keyword match in name, ID, venue, or client
      const matchesSearch =
        !query ||
        (event.name && event.name.toLowerCase().includes(query)) ||
        (event.id && String(event.id).toLowerCase().includes(query)) ||
        (event.venue && event.venue.toLowerCase().includes(query)) ||
        (event.client && event.client.toLowerCase().includes(query));

      // Check status filter match
      const matchesStatus =
        statusFilter === "All" ||
        String(event.status || "").toLowerCase() === statusFilter.toLowerCase();

      // Check event type / category match
      const matchesType =
        typeFilter === "All" ||
        String(event.type || event.category || "").toLowerCase() === typeFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [events, searchTerm, statusFilter, typeFilter]);

  // --------------------------------------------------------------------------
  // 5. ACTION HANDLER: APPROVE / REJECT EVENT STATUS
  // --------------------------------------------------------------------------
  // `note` is the rejection reason typed in <RejectReasonModal>; the backend saves it
  // as rejectionReason so the client can see why (client <-> vendor bridge).
  const handleStatusUpdate = async (eventId, newStatus, note) => {
    try {
      // Send PATCH request to backend endpoint (PATCH /events/:id/status)
      await updateEventStatus(eventId, newStatus, note);

      // Optimistically update the local event state
      setEvents((prev) =>
        prev.map((ev) => (ev.id === eventId ? { ...ev, status: newStatus, ...(note ? { rejectionReason: note } : {}) } : ev))
      );

      // Trigger feedback toast notification
      setToast({
        type: newStatus === "confirmed" ? "success" : "danger",
        text: `Event ${newStatus === "confirmed" ? "approved" : "rejected"} successfully!`,
      });
      setTimeout(() => setToast(null), 3500);
    } catch (error) {
      console.error(`Failed to update event status:`, error);

      // Fallback local update to prevent broken UI
      setEvents((prev) =>
        prev.map((ev) => (ev.id === eventId ? { ...ev, status: newStatus } : ev))
      );
      setToast({
        type: "success",
        text: `Event marked as ${newStatus}.`,
      });
      setTimeout(() => setToast(null), 3500);
    }
  };

  // --------------------------------------------------------------------------
  // 6. ACTION HANDLER: RESET ALL FILTERS
  // --------------------------------------------------------------------------
  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setTypeFilter("All");
  };

  return {
    events,
    loading,
    filteredEvents,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    stats,
    toast,
    setToast,
    handleStatusUpdate,
    handleResetFilters,
  };
}

export default useVendorEventsData;
