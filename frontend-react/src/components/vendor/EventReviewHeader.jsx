/**
 * ============================================================================
 * EVENT REVIEW HEADER COMPONENT (EventReviewHeader.jsx)
 * ============================================================================
 * Role: Reusable Component (Vendor Portal)
 * Location: src/components/vendor/EventReviewHeader.jsx
 *
 * Purpose:
 *   Replicates legacy Event Review top header layout:
 *     - Event primary title (e.g. "Tech Summit 2026")
 *     - Subtitle with Event ID and Category Type
 *     - Prominent status pill badge (Under Review / Approved / Rejected / Live)
 * ============================================================================
 */

import React from "react";

function EventReviewHeader({ event }) {
  if (!event) return null;

  const status = String(event.status || "pending").toLowerCase();

  // Status mapping matching legacy
  const statusConfig = {
    pending: {
      label: "Under Review",
      style: {
        background: "rgba(234, 179, 8, 0.15)",
        color: "var(--yellow, #eab308)",
        border: "1px solid rgba(234, 179, 8, 0.3)",
      },
    },
    waiting: {
      label: "Waiting / On Hold",
      style: {
        background: "rgba(217, 119, 6, 0.18)",
        color: "#fbbf24",
        border: "1px solid rgba(217, 119, 6, 0.35)",
      },
    },
    confirmed: {
      label: "Approved",
      style: {
        background: "rgba(34, 197, 94, 0.15)",
        color: "var(--green, #22c55e)",
        border: "1px solid rgba(34, 197, 94, 0.3)",
      },
    },
    approved: {
      label: "Approved",
      style: {
        background: "rgba(34, 197, 94, 0.15)",
        color: "var(--green, #22c55e)",
        border: "1px solid rgba(34, 197, 94, 0.3)",
      },
    },
    rejected: {
      label: "Rejected",
      style: {
        background: "rgba(239, 68, 68, 0.15)",
        color: "var(--red, #ef4444)",
        border: "1px solid rgba(239, 68, 68, 0.3)",
      },
    },
    live: {
      label: "Live",
      style: {
        background: "rgba(59, 130, 246, 0.15)",
        color: "var(--blue, #3b82f6)",
        border: "1px solid rgba(59, 130, 246, 0.3)",
      },
    },
    completed: {
      label: "Completed",
      style: {
        background: "rgba(107, 93, 126, 0.15)",
        color: "var(--text-muted, #6b5d7e)",
        border: "1px solid rgba(107, 93, 126, 0.3)",
      },
    },
  };

  const currentStatus = statusConfig[status] || statusConfig.pending;

  return (
    <div className="ev-header" aria-label="Event Review Title and Status">
      <div className="ev-header__left">
        <h2>{event.name || "Untitled Event"}</h2>
        <p>
          Event ID: {event.id} · {event.type || "Event"}
        </p>
      </div>

      <div>
        <span
          className="ev-status-badge"
          style={currentStatus.style}
        >
          {currentStatus.label}
        </span>
      </div>
    </div>
  );
}

export default React.memo(EventReviewHeader);
