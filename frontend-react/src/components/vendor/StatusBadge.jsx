import React from "react";

/**
 * StatusBadge Component
 * ----------------------------------------------------------------------------
 * Reusable pill badge that normalizes and styles event status values.
 * Colors:
 *   - pending: Amber / Yellow
 *   - confirmed / approved / completed: Green
 *   - live: Blue (with pulse animation)
 *   - rejected: Red
 *
 * @param {Object} props
 * @param {string} props.status - Current status string (e.g., "pending", "confirmed")
 */
function StatusBadge({ status = "pending" }) {
  const normalized = String(status || "pending").toLowerCase().trim();

  return (
    <span className={`status-badge ${normalized}`}>
      {/* Show small animated dot for live status */}
      {normalized === "live" && <span className="live-pulse-dot" />}
      {status}
    </span>
  );
}

export default StatusBadge;
