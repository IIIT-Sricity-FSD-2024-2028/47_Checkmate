/**
 * ============================================================================
 * VENDOR UPCOMING EVENT CARD ITEM COMPONENT (UpcomingEventsCard.jsx)
 * ============================================================================
 * Role: Atomic Presentation Component (Vendor Dashboard Portal)
 * Location: src/components/vendor/UpcomingEventsCard.jsx
 *
 * Features:
 *   1. Displays event headline name and venue.
 *   2. Displays formatted scheduled date with relative time ("in 4 days").
 *   3. Distinct status coloring:
 *        - Confirmed (green)
 *        - Pending (amber)
 *        - Live (red pulsing dot)
 *        - Rejected (red)
 *        - Completed (gray/teal)
 *   4. Staffing progress indicator (e.g. "3/5 staff assigned").
 *   5. Hover quick actions: "View" and "Assign Staff".
 * ============================================================================
 */

import React, { useState } from "react";
import { Calendar, Users, Eye, UserPlus } from "lucide-react";

function UpcomingEventsCard({
  event_name,
  status,
  timeAndVenue,
  relativeTime,
  staffing,
  _venue,
  onView,
  onAssign,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const statusLower = (status || "").toLowerCase().trim();

  // Status color styles mapping
  let badgeClass = "badge-pending";
  let statusText = status || "Pending";

  if (statusLower === "confirmed" || statusLower === "approved") {
    badgeClass = "badge-confirmed";
  } else if (statusLower === "live") {
    badgeClass = "badge-live";
  } else if (statusLower === "rejected") {
    badgeClass = "badge-rejected";
  } else if (statusLower === "completed" || statusLower === "done") {
    badgeClass = "badge-completed";
  }

  const staffText = staffing?.text || "Staff assigned";
  const staffPct = staffing?.pct ?? 50;

  return (
    <div
      className="event-item"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      tabIndex={0}
      style={{
        position: "relative",
        padding: "14px 16px",
        background: isHovered ? "rgba(255, 255, 255, 0.04)" : "transparent",
        borderRadius: "10px",
        transition: "background 0.18s ease, transform 0.18s ease",
      }}
    >
      <div className="event-info" style={{ flex: 1, minWidth: 0 }}>
        {/* Event Headline Name & Relative Time Tag */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
          <span className="event-name" style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-primary, #f8fafc)" }}>
            {event_name}
          </span>
          {relativeTime && (
            <span
              style={{
                fontSize: "10.5px",
                fontWeight: 600,
                padding: "2px 7px",
                borderRadius: "12px",
                background: "rgba(168, 85, 247, 0.15)",
                color: "#c084fc",
                border: "1px solid rgba(168, 85, 247, 0.3)",
              }}
            >
              {relativeTime}
            </span>
          )}
        </div>

        {/* Time, Venue & Staffing Indicator Metadata Row */}
        <div
          className="event-meta"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: "12px",
            color: "var(--text-secondary, #cbd5e1)",
            flexWrap: "wrap",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Calendar size={13} color="var(--text-muted, #94a3b8)" />
            {timeAndVenue}
          </span>

          {/* Staffing indicator */}
          {staffing && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                color: staffPct >= 100 ? "#86efac" : staffPct > 0 ? "#fde047" : "#fca5a5",
                fontSize: "11px",
                fontWeight: 500,
              }}
              title="Assigned vs required staff members"
            >
              <Users size={12} />
              {staffText}
            </span>
          )}
        </div>
      </div>

      {/* Right Column: Status Badge or Hover Quick Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Status Badge */}
        <span
          className={`status-badge-styled ${badgeClass}`}
          style={{
            fontSize: "11px",
            fontWeight: 600,
            padding: "4px 10px",
            borderRadius: "20px",
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            textTransform: "capitalize",
            whiteSpace: "nowrap",
          }}
        >
          {statusLower === "live" && (
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#ef4444",
                boxShadow: "0 0 8px #ef4444",
                display: "inline-block",
                animation: "pulseDot 1.5s infinite",
              }}
            />
          )}
          {statusText}
        </span>

        {/* Hover Quick Action Buttons */}
        <div
          className="event-hover-actions"
          style={{
            display: isHovered ? "flex" : "none",
            alignItems: "center",
            gap: 6,
          }}
        >
          <button
            type="button"
            onClick={onView}
            className="btn-event-quick"
            title="Review event details"
            aria-label={`Review details for ${event_name}`}
            style={{
              padding: "4px 8px",
              background: "rgba(59, 130, 246, 0.2)",
              border: "1px solid rgba(59, 130, 246, 0.4)",
              borderRadius: "6px",
              color: "#93c5fd",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Eye size={12} /> View
          </button>

          <button
            type="button"
            onClick={onAssign}
            className="btn-event-quick"
            title="Assign staff to this event"
            aria-label={`Assign staff for ${event_name}`}
            style={{
              padding: "4px 8px",
              background: "rgba(34, 197, 94, 0.2)",
              border: "1px solid rgba(34, 197, 94, 0.4)",
              borderRadius: "6px",
              color: "#86efac",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <UserPlus size={12} /> Staff
          </button>
        </div>
      </div>
    </div>
  );
}

export default UpcomingEventsCard;