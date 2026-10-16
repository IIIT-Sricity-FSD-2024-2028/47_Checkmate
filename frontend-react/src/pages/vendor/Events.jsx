/**
 * ============================================================================
 * MODULAR VENDOR EVENT REQUESTS PAGE (Events.jsx)
 * ============================================================================
 * Role: Event Coordinator / Vendor
 * Purpose:
 *   High-level parent page for the Vendor Event Requests portal:
 *     1. Connects to `useVendorEventsData` custom hook for state & async queries.
 *     2. Assembles focused, reusable modular subcomponents:
 *         - <TopHeaderBar>: Unified top navigation bar with page title.
 *         - <EventsToastFeedback>: Immediate feedback banner for approve/reject actions.
 *         - <EventsStatsGrid>: 4-column KPI metric cards (Total, Pending, Confirmed, Live).
 *         - <EventsToolbar>: Search box and multi-criteria status/category filters.
 *         - <EventsTable>: Tabular list displaying event records via <EventTableRow>.
 *         - <RejectReasonModal>: Asks for a rejection reason; the client sees it.
 *
 * Connected Backend Endpoints:
 *   - GET   /events (via getMyEvents) -> fetches vendor-scoped assigned events
 *   - PATCH /events/:id/status (via updateEventStatus) -> approves/rejects event
 * ============================================================================
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Stylesheets
import "../../styles/vendor.css";
import "../../styles/dashboard.css";
import "../../styles/bridge.css";

// Global & Shared Reusable UI Components
import TopHeaderBar from "../../components/TopHeaderBar";

// Custom Data Retrieval & Mutation Hook
import useVendorEventsData from "../../components/vendor/useVendorEventsData";

// Modular Vendor Events Subcomponents
import EventsToastFeedback from "../../components/vendor/EventsToastFeedback";
import EventsStatsGrid from "../../components/vendor/EventsStatsGrid";
import EventsToolbar from "../../components/vendor/EventsToolbar";
import EventsTable from "../../components/vendor/EventsTable";
import RejectReasonModal from "../../components/vendor/RejectReasonModal";

function Events() {
  // Navigation hook to transition to the dedicated Event Review inspection page
  const navigate = useNavigate();

  // Connect to custom data hook handling async loading, search filtering, KPI metrics, and mutations
  const {
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
  } = useVendorEventsData();

  // Event whose "reject with reason" popup is open (null = closed)
  const [rejectingEvent, setRejectingEvent] = useState(null);

  // Sends the rejection with the typed reason, then closes the popup.
  // (?. because the React Compiler reads this function's dependencies while
  // rendering, when no event is being rejected yet.)
  const handleConfirmReject = async (reason) => {
    const eventId = rejectingEvent?.id;
    if (!eventId) return;
    await handleStatusUpdate(eventId, "rejected", reason);
    setRejectingEvent(null);
  };

  // Navigate to detailed Event Review page
  const handleView = (event) => {
    if (event?.id) {
      navigate(`/vendor/events/${event.id}/review`);
    }
  };

  return (
    <div className="vendor-page">
      {/* ── Top Header Navigation Bar ── */}
      <TopHeaderBar title="Event Requests" />

      <div className="vendor-content">
        {/* ── Component 1: Transient Action Feedback Toast Banner ── */}
        <EventsToastFeedback
          toast={toast}
          onClose={() => setToast(null)}
        />

        {/* ── Component 2: 4-Column KPI Summary Metric Cards ── */}
        <EventsStatsGrid
          stats={stats}
          loading={loading}
        />

        {/* ── Component 3: Search Box & Multi-Criteria Filter Toolbar ── */}
        <EventsToolbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
          matchingCount={filteredEvents.length}
          totalCount={events.length}
          onReset={handleResetFilters}
        />

        {/* ── Component 4: Event Requests Data Table with Modular Rows ── */}
        <EventsTable
          events={filteredEvents}
          loading={loading}
          onView={handleView}
          onApprove={(id) => handleStatusUpdate(id, "confirmed")}
          onReject={(id) => setRejectingEvent(events.find((ev) => ev.id === id) || null)}
        />

        {/* ── Component 5: Reject reason popup (reason is shown to the client) ── */}
        <RejectReasonModal
          event={rejectingEvent}
          onClose={() => setRejectingEvent(null)}
          onConfirm={handleConfirmReject}
        />
      </div>
    </div>
  );
}

export default Events;