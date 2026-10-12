import React from "react";
import { Eye, Check, X } from "lucide-react";
import StatusBadge from "./StatusBadge";

/**
 * EventTableRow Component
 * ----------------------------------------------------------------------------
 * Renders a single row in the vendor event requests table.
 *
 * Props:
 *  - event: The event object containing id, name, type, date, venue, etc.
 *  - onView: Function called to navigate to the Event Review page
 *  - onApprove: Function called when approving the event request
 *  - onReject: Function called when rejecting the event request
 */
function EventTableRow({ event, onView, onApprove, onReject }) {
  const evId = event.id || "EVT-001";
  const status = String(event.status || "pending").toLowerCase();

  // Helper to format ISO dates into friendly readable strings (e.g., "Oct 24, 2026")
  const formatDate = (dateValue) => {
    if (!dateValue) return "Date TBD";
    const d = new Date(dateValue);
    return isNaN(d.getTime())
      ? dateValue
      : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

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
      <td>{event.venue || "Venue TBD"}</td>

      {/* Expected Attendance / Guest Count */}
      <td>{event.attendees || event.people || event.guests || "—"}</td>

      {/* Reusable Status Badge Component */}
      <td>
        <StatusBadge status={event.status} />
      </td>

      {/* Action Buttons: View (Review Page), Approve, Reject */}
      <td className="table-actions-cell">
        <div className="table-actions">
          {/* View / Review Event Button (Navigates to Event Review page) */}
          <button
            className="action-btn view"
            title="Review Event"
            onClick={() => onView && onView(event)}
          >
            <Eye size={16} />
          </button>

          {/* Approve Button (Visible unless already confirmed) */}
          {status !== "confirmed" && (
            <button
              className="action-btn approve"
              title="Approve Request"
              onClick={() => onApprove && onApprove(evId)}
            >
              <Check size={16} />
            </button>
          )}

          {/* Reject Button (Visible unless already rejected) */}
          {status !== "rejected" && (
            <button
              className="action-btn reject"
              title="Reject Request"
              onClick={() => onReject && onReject(evId)}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default EventTableRow;
