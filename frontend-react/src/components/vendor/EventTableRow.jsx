/**
 * ============================================================================
 * VENDOR EVENT TABLE ROW COMPONENT (EventTableRow.jsx)
 * ============================================================================
 * Role: Atomic Table Presentation Component (Vendor Events Portal)
 * Location: src/components/vendor/EventTableRow.jsx
 *
 * Parent / Invocation Context:
 *   - Called By: src/components/vendor/EventsTable.jsx (Lines 75–84)
 *   - Parent Page: Vendor Event Requests (src/pages/vendor/Events.jsx, Component 4 via <EventsTable>)
 *   - Also Reused In: src/components/client/ClientEventsTable.jsx (src/pages/client/MyEvents.jsx)
 *   - Where in Code: Rendered inside the <tbody> row mapping loop of <EventsTable>
 *     over `events.map(event => <EventTableRow ... />)`.
 *
 * Purpose:
 *   Renders an individual tabular record in the vendor's incoming event requests:
 *     1. Displays event identifier formatted with branded prefix (e.g. EVT-0042).
 *     2. Formats event name, category type badge, localized scheduled date, venue,
 *        and expected attendance headcount.
 *     3. Renders the reusable <StatusBadge> indicating current lifecycle state.
 *     4. Houses a 3-slot aligned action toolbar:
 *        - Slot 1: View Details / Review Event (routes to Event Review screen)
 *        - Slot 2: Approve Request (with aligned placeholder when already approved)
 *        - Slot 3: Reject Request (with aligned placeholder when already rejected)
 *
 * Props:
 *   @param {Object} props.event - The event data object (id, name, type, date, venue, attendees, status)
 *   @param {Function} props.onView - Callback invoked to navigate to event review / details
 *   @param {Function} props.onApprove - Callback invoked when approving the request
 *   @param {Function} props.onReject - Callback invoked when rejecting the request
 *   @param {Function} props.onDelete - Callback invoked when permanently deleting a rejected event
 * ============================================================================
 */

import React from "react";
import { Eye, Check, X, Trash2, AlertTriangle } from "lucide-react";
import StatusBadge from "./StatusBadge";

function EventTableRow({ event, collisions = [], onView, onApprove, onReject, onDelete }) {
  // --------------------------------------------------------------------------
  // 1. DATA EXTRACTION & DEFAULTS
  // --------------------------------------------------------------------------
  const evId = event.id || "EVT-001";
  const status = String(event.status || "pending").toLowerCase();

  // --------------------------------------------------------------------------
  // 2. SCHEDULE DATE FORMATTING HELPER
  // --------------------------------------------------------------------------
  // Helper to format ISO dates into friendly readable strings (e.g., "Oct 24, 2026")
  const formatDate = (dateValue) => {
    if (!dateValue) return "Date TBD";
    const d = new Date(dateValue);
    return isNaN(d.getTime())
      ? dateValue
      : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // --------------------------------------------------------------------------
  // 3. RENDER TABLE ROW
  // --------------------------------------------------------------------------

  return (
    <tr>
      {/* Event ID with branded pink accent */}
      <td className="col-id">
        {String(evId).startsWith("EVT") ? evId : `EVT-${String(evId).slice(-4).toUpperCase()}`}
      </td>

      {/* Primary Event Name */}
      <td className="col-primary">{event.name || "Untitled Event"}</td>

      {/* Category / Type badge (Conference, Wedding, etc.) */}
      <td>
        <span className="badge badge--conference">
          {event.type || "General"}
        </span>
      </td>

      {/* Scheduled Date */}
      <td>{formatDate(event.date)}</td>

      {/* Venue Location */}
      <td>
        <div>{event.venue || "Venue TBD"}</div>
        {status === "pending" && collisions.length > 0 && (
          <div
            className="venue-collision-subtext"
            title={collisions[0].desc}
          >
            <AlertTriangle size={11} />
            <span>Collides with {collisions[0].conflictingEvent?.name || collisions[0].conflictingEvent?.id}</span>
          </div>
        )}
      </td>

      {/* Expected Attendance / Guest Count */}
      <td>{event.attendees || event.people || event.guests || "—"}</td>

      {/* Reusable Status Badge Component */}
      <td>
        <StatusBadge status={event.status} />
        {status === "pending" && collisions.length > 0 && (
          <div
            className={`collision-warning-pill ${
              collisions[0].severity === "high" ? "high" : "medium"
            }`}
            title={collisions.map((c) => c.desc).join("\n")}
          >
            <AlertTriangle size={11} />
            <span>{collisions[0].type}</span>
          </div>
        )}
      </td>

      {/* Action Buttons: View (Review Page), Approve, Reject */}
      <td className="table-actions-cell">
        <div className="table-actions">
          {/* Slot 1: View / Review Event Button (Always in Column 1) */}
          <button
            className="action-btn view"
            title="Review Event"
            onClick={() => onView && onView(event)}
          >
            <Eye size={20} />
          </button>

          {/* Slot 2: Approve Button (Only when pending; placeholder keeps alignment if already confirmed/rejected) */}
          {status === "pending" ? (
            <button
              className="action-btn approve"
              title={collisions.length > 0 ? "Approve Request (Venue Collision Detected)" : "Approve Request"}
              onClick={() => onApprove && onApprove(event)}
            >
              <Check size={20} />
            </button>
          ) : (
            <span className="action-btn-placeholder" aria-hidden="true" />
          )}

          {/* Slot 3: Reject Button when pending / Delete Button when rejected */}
          {status === "rejected" ? (
            <button
              className="action-btn delete"
              title="Permanently Delete Event"
              onClick={() => onDelete && onDelete(event)}
            >
              <Trash2 size={20} />
            </button>
          ) : status === "pending" ? (
            <button
              className="action-btn reject"
              title="Reject Request"
              onClick={() => onReject && onReject(evId)}
            >
              <X size={20} />
            </button>
          ) : (
            <span className="action-btn-placeholder" aria-hidden="true" />
          )}
        </div>
      </td>
    </tr>
  );
}

export default EventTableRow;
