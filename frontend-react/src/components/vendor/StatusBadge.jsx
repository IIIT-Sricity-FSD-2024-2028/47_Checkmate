/**
 * ============================================================================
 * VENDOR STATUS BADGE COMPONENT (StatusBadge.jsx)
 * ============================================================================
 * Role: Atomic Reusable Component (Vendor Portal)
 * Location: src/components/vendor/StatusBadge.jsx
 *
 * Parent / Invocation Context:
 *   - Called By:
 *       • src/components/vendor/EventReviewHeader.jsx (Line 54)
 *       • src/components/vendor/EventTableRow.jsx (Line 79)
 *       • src/components/vendor/PackageCard.jsx (Line 73)
 *       • Also reused in client tables and administrative dashboards
 *   - Where in Code: Rendered inside status table cells and card header rows
 *     to display standardized lifecycle pills (pending, confirmed, live, rejected).
 *
 * Purpose:
 *   Normalizes, maps, and styles event status badges across all vendor views:
 *     - Provides unified color-coding for event lifecycle states:
 *         * Pending: Amber / Yellow (action required)
 *         * Confirmed / Approved / Completed: Green (ready / finished)
 *         * Live: Blue (currently ongoing with animated pulse indicator)
 *         * Rejected: Red (declined request)
 *
 * Props:
 *   @param {string} props.status - Current status string (defaults to "pending")
 * ============================================================================
 */

import React from "react";

function StatusBadge({ status = "pending" }) {
  // --------------------------------------------------------------------------
  // 1. STATUS NORMALIZATION
  // --------------------------------------------------------------------------
  // Clean string and standardize casing to ensure consistent CSS class mapping
  const normalized = String(status || "pending").toLowerCase().trim();

  // --------------------------------------------------------------------------
  // 2. RENDER COMPONENT
  // --------------------------------------------------------------------------
  return (
    <span className={`status-badge ${normalized}`}>
      {/* ── Animated Live Indicator Dot ── */}
      {/* Conditionally renders an animated pulsating beacon for currently active events */}
      {normalized === "live" && <span className="live-pulse-dot" />}

      {/* ── Status Text Label ── */}
      {status}
    </span>
  );
}

export default StatusBadge;
