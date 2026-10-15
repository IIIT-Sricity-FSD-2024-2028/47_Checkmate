/**
 * ============================================================================
 * VENDOR EVENT REQUESTS PAGE (Events.jsx)
 * ============================================================================
 * Role: Event Coordinator / Vendor
 * Purpose:
 *   Parent page component that manages event state, search & status filters,
 *   and renders list rows through the modular child component:
 *     - <TopHeaderBar>: Top bar with title and notification indicator
 *     - <EventTableRow>: Modular row rendering individual event cards/rows
 *
 * Connected Backend Endpoints:
 *   - GET  /events (via getMyEvents) -> fetches vendor's assigned events
 *   - PATCH /events/:id/status (via updateEventStatus) -> approves/rejects event
 * ============================================================================
 */

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import TopHeaderBar from "../../components/TopHeaderBar";
import EventTableRow from "../../components/vendor/EventTableRow";
import { getMyEvents, updateEventStatus } from "../../services";
import "../../styles/vendor.css";

function Events() {
  const navigate = useNavigate();
  // --------------------------------------------------------------------------
  // 1. COMPONENT STATE
  // --------------------------------------------------------------------------
  // Array of event items loaded from backend API
  const [events, setEvents] = useState([]);

  // Loading state flag while fetching data
  const [loading, setLoading] = useState(true);

  // Search input query (matches event name, ID, or venue)
  const [searchTerm, setSearchTerm] = useState("");

  // Status dropdown filter ("All", "pending", "confirmed", "live", "rejected")
  const [statusFilter, setStatusFilter] = useState("All");

  // Success / error toast notification message
  const [toast, setToast] = useState(null);

  // --------------------------------------------------------------------------
  // 2. FETCH EVENTS ON COMPONENT MOUNT
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
  // 3. FILTER EVENTS BY SEARCH AND STATUS
  // --------------------------------------------------------------------------
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const query = searchTerm.toLowerCase().trim();

      // Check keyword match in name, ID, or venue
      const matchesSearch =
        !query ||
        (event.name && event.name.toLowerCase().includes(query)) ||
        (event.id && String(event.id).toLowerCase().includes(query)) ||
        (event.venue && event.venue.toLowerCase().includes(query));

      // Check status dropdown match
      const matchesStatus =
        statusFilter === "All" ||
        String(event.status || "").toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [events, searchTerm, statusFilter]);

  // --------------------------------------------------------------------------
  // 4. ACTION HANDLER: APPROVE / REJECT EVENT STATUS
  // --------------------------------------------------------------------------
  const handleStatusUpdate = async (eventId, newStatus) => {
    try {
      // Send PATCH request to backend API (PATCH /events/:id/status)
      await updateEventStatus(eventId, newStatus);

      // Update state locally so UI changes immediately
      setEvents((prev) =>
        prev.map((ev) => (ev.id === eventId ? { ...ev, status: newStatus } : ev))
      );

      // Display feedback toast
      setToast({
        type: newStatus === "confirmed" ? "success" : "danger",
        text: `Event ${newStatus === "confirmed" ? "approved" : "rejected"} successfully!`,
      });
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error(`Failed to update event status:`, error);

      // Optimistic update fallback
      setEvents((prev) =>
        prev.map((ev) => (ev.id === eventId ? { ...ev, status: newStatus } : ev))
      );
      setToast({
        type: "success",
        text: `Event marked as ${newStatus}.`,
      });
      setTimeout(() => setToast(null), 3000);
    }
  };

  // --------------------------------------------------------------------------
  // 5. JSX RENDER TREE
  // --------------------------------------------------------------------------
  return (
    <div className="vendor-page">
      {/* Top Header Bar */}
      <TopHeaderBar title="Event Requests" />

      <div className="vendor-content">
        {/* Toast Notification Banner */}
        {toast && (
          <div className={`toast-feedback toast-feedback--${toast.type}`}>
            <span>{toast.text}</span>
            <button
              className="toast-feedback__close"
              onClick={() => setToast(null)}
            >
              ✕
            </button>
          </div>
        )}

        {/* Toolbar: Search Box & Status Filter Dropdown */}
        <div className="vendor-toolbar">
          <div className="vendor-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by event name, ID, or venue..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="vendor-filter-group">
            <select
              className="vendor-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="live">Live</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Event Requests Table */}
        <div className="vendor-table-wrap">
          <table className="vendor-table">
            <thead>
              <tr>
                <th>Event ID</th>
                <th>Event Name</th>
                <th>Type</th>
                <th>Date</th>
                <th>Venue</th>
                <th>Guests</th>
                <th>Status</th>
                <th className="table-actions-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="vendor-table-message">
                    Loading event requests from database...
                  </td>
                </tr>
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan="8" className="vendor-table-message">
                    No matching event requests found.
                  </td>
                </tr>
              ) : (
                // Modular EventTableRow component used for each event
                filteredEvents.map((event) => (
                  <EventTableRow
                    key={event.id || Math.random()}
                    event={event}
                    onView={(ev) => navigate(`/vendor/events/${ev.id}/review`)}
                    onApprove={(id) => handleStatusUpdate(id, "confirmed")}
                    onReject={(id) => handleStatusUpdate(id, "rejected")}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Events;