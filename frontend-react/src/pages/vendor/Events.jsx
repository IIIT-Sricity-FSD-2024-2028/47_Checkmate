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
import { Trash2, X, AlertTriangle } from "lucide-react";

// Services
import { findEventCollisions } from "../../services/eventService";

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

  // Pending event with venue/time collisions whose warning dialogue is open (null = closed)
  const [collidingApprovalEvent, setCollidingApprovalEvent] = useState(null);

  // Initiates event approval, checking for venue & time collisions with confirmed events
  const handleInitiateApprove = (targetEventOrId) => {
    const target =
      typeof targetEventOrId === "object" && targetEventOrId !== null
        ? targetEventOrId
        : events.find((ev) => ev.id === targetEventOrId);
    if (!target) return;

    const pool = Array.isArray(allEvents) && allEvents.length > 0 ? allEvents : events;
    const cols = findEventCollisions(target, pool);
    if (cols.length > 0) {
      setCollidingApprovalEvent({ event: target, collisions: cols });
    } else {
      handleStatusUpdate(target.id, "confirmed");
    }
  };

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
          onApprove={handleInitiateApprove}
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

        {/* ── Inline Venue Collision Warning Dialogue Box (No separate component created) ── */}
        {collidingApprovalEvent && (
          <div
            className="vendor-modal-backdrop"
            onClick={() => setCollidingApprovalEvent(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="collision-dialog-title"
          >
            <div
              className="vendor-modal"
              style={{ maxWidth: 540 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="vendor-modal__header">
                <h3
                  id="collision-dialog-title"
                  style={{ display: "flex", alignItems: "center", gap: "8px", color: "#fca5a5" }}
                >
                  <AlertTriangle size={20} color="#ef4444" />
                  Venue Collision Warning
                </h3>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setCollidingApprovalEvent(null)}
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
                  An existing confirmed event is already scheduled at this venue. Approving this request will create a venue conflict.
                </p>

                {/* Incoming Request Summary */}
                <div
                  style={{
                    background: "rgba(168, 85, 247, 0.08)",
                    border: "1px solid rgba(168, 85, 247, 0.25)",
                    borderRadius: "8px",
                    padding: "12px 14px",
                    fontSize: "13px",
                    color: "var(--text-primary, #f0e8ff)",
                  }}
                >
                  <div>
                    <strong>Incoming Request:</strong> {collidingApprovalEvent.event.name} ({collidingApprovalEvent.event.id})
                  </div>
                  <div style={{ marginTop: "4px", color: "var(--text-secondary, #9b8db0)" }}>
                    <strong>Venue:</strong> {collidingApprovalEvent.event.venue} &bull; <strong>Date:</strong> {collidingApprovalEvent.event.date} {collidingApprovalEvent.event.time ? `at ${collidingApprovalEvent.event.time}` : ""}
                  </div>
                </div>

                {/* Colliding Events Details */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {collidingApprovalEvent.collisions.map((col, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: col.severity === "high" ? "rgba(239, 68, 68, 0.1)" : "rgba(234, 179, 8, 0.1)",
                        border: `1px solid ${col.severity === "high" ? "rgba(239, 68, 68, 0.3)" : "rgba(234, 179, 8, 0.3)"}`,
                        borderRadius: "8px",
                        padding: "10px 12px",
                        fontSize: "12.5px",
                        color: "var(--text-primary, #f0e8ff)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ fontWeight: 600, color: col.severity === "high" ? "#fca5a5" : "#fde047" }}>
                          {col.type}
                        </span>
                        <span
                          className={`conflict-severity-pill ${col.severity === "high" ? "high" : "medium"}`}
                          style={{ fontSize: "9px", padding: "2px 8px" }}
                        >
                          {col.severity}
                        </span>
                      </div>
                      <div style={{ color: "var(--text-secondary, #9b8db0)", lineHeight: "1.4" }}>
                        {col.desc}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ color: "#f87171", fontSize: "12px" }}>
                  ⚠️ Proceeding will double-book this venue. It is recommended to review requirements or contact the client to reschedule.
                </div>
              </div>

              <div className="vendor-modal__footer" style={{ justifyContent: "space-between" }}>
                <button
                  type="button"
                  className="btn-resolve-nav"
                  style={{
                    background: "rgba(168, 85, 247, 0.15)",
                    border: "1px solid rgba(168, 85, 247, 0.4)",
                    color: "#c084fc",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                  onClick={() => {
                    const id = collidingApprovalEvent.event.id;
                    setCollidingApprovalEvent(null);
                    navigate(`/vendor/events/${id}/review`);
                  }}
                >
                  Review in Detail
                </button>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    className="btn-back"
                    onClick={() => setCollidingApprovalEvent(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-approve"
                    style={{ background: "#e11d48", borderColor: "#f43f5e" }}
                    onClick={() => {
                      const id = collidingApprovalEvent.event.id;
                      setCollidingApprovalEvent(null);
                      handleStatusUpdate(id, "confirmed");
                    }}
                  >
                    Confirm Anyway
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Events;