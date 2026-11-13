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
import { Trash2, X } from "lucide-react";

// Stylesheets
import "../../styles/vendor.css";
import "../../styles/dashboard.css";
import "../../styles/bridge.css";

// Global & Shared Reusable UI Components
import VendorTopBar from "../../components/vendor/VendorTopBar";

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
    allEvents,
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
    handleDeleteEvent,
    handleResetFilters,
  } = useVendorEventsData();

  // Event whose "reject with reason" popup is open (null = closed)
  const [rejectingEvent, setRejectingEvent] = useState(null);

  // Rejected event whose delete confirmation dialogue is open (null = closed)
  const [deletingEvent, setDeletingEvent] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sends the rejection with the typed reason, then closes the popup.
  // (?. because the React Compiler reads this function's dependencies while
  // rendering, when no event is being rejected yet.)
  const handleConfirmReject = async (reason) => {
    const eventId = rejectingEvent?.id;
    if (!eventId) return;
    await handleStatusUpdate(eventId, "rejected", reason);
    setRejectingEvent(null);
  };

  // Permanently deletes the event from backend and closes confirmation dialogue
  const handleConfirmDelete = async () => {
    const eventId = deletingEvent?.id;
    if (!eventId) return;
    setIsDeleting(true);
    try {
      await handleDeleteEvent(eventId);
    } finally {
      setIsDeleting(false);
      setDeletingEvent(null);
    }
  };

  // Navigate to detailed Event Review page
  const handleView = (event) => {
    if (event?.id) {
      navigate(`/vendor/events/${event.id}/review`);
    }
  };

  return (
    <div className="vendor-page">
      {/* ── Top Header Navigation Bar with Notifications ── */}
      <VendorTopBar title="Event Requests" />

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
          allEvents={allEvents}
          loading={loading}
          onView={handleView}
          onReject={(id) => setRejectingEvent(events.find((ev) => ev.id === id) || null)}
          onDelete={(event) => setDeletingEvent(event)}
        />

        {/* ── Component 5: Reject reason popup (reason is shown to the client) ── */}
        <RejectReasonModal
          event={rejectingEvent}
          onClose={() => setRejectingEvent(null)}
          onConfirm={handleConfirmReject}
        />

        {/* ── Inline Delete Confirmation Dialogue Box (No separate component created) ── */}
        {deletingEvent && (
          <div
            className="vendor-modal-backdrop"
            onClick={() => !isDeleting && setDeletingEvent(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
          >
            <div
              className="vendor-modal"
              style={{ maxWidth: 460 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="vendor-modal__header">
                <h3
                  id="delete-dialog-title"
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <Trash2 size={20} color="#ef4444" />
                  Confirm Event Deletion
                </h3>
                <button
                  type="button"
                  className="modal-close-btn"
                  disabled={isDeleting}
                  onClick={() => setDeletingEvent(null)}
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="vendor-modal__body">
                <p
                  style={{
                    color: "var(--text-secondary, #9b8db0)",
                    fontSize: "14px",
                    lineHeight: "1.6",
                    margin: 0,
                  }}
                >
                  Are you sure you want to permanently delete this event?
                </p>
                <div
                  style={{
                    background: "rgba(239, 68, 68, 0.08)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    borderRadius: "8px",
                    padding: "12px 14px",
                    fontSize: "13px",
                    color: "var(--text-primary, #f0e8ff)",
                  }}
                >
                  <div>
                    <strong>Event:</strong> {deletingEvent.name || "Untitled Event"} ({deletingEvent.id})
                  </div>
                  {deletingEvent.client && (
                    <div style={{ marginTop: "4px", color: "var(--text-secondary, #9b8db0)" }}>
                      <strong>Client:</strong> {deletingEvent.client}
                    </div>
                  )}
                  <div style={{ marginTop: "6px", color: "#f87171", fontSize: "12px" }}>
                    ⚠️ This action is permanent and cannot be undone.
                  </div>
                </div>
              </div>
              <div className="vendor-modal__footer">
                <button
                  type="button"
                  className="btn-back"
                  disabled={isDeleting}
                  onClick={() => setDeletingEvent(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-reject"
                  style={{
                    background: "#dc2626",
                    borderColor: "#ef4444",
                    color: "#fff",
                    fontWeight: 600,
                  }}
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                >
                  <Trash2 size={16} />
                  {isDeleting ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Events;