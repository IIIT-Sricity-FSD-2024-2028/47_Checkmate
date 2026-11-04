/**
 * ============================================================================
 * VENDOR CRITICAL ALERT ITEM COMPONENT (AlertItem.jsx)
 * ============================================================================
 * Role: Atomic Presentation Component (Vendor Dashboard Portal)
 * Location: src/components/vendor/AlertItem.jsx
 *
 * Parent / Invocation Context:
 *   - Called By: src/components/vendor/VendorCriticalAlertsSection.jsx (Lines 41–48)
 *   - Parent Page: Vendor Dashboard (src/pages/vendor/Dashboard.jsx, Component 5 in right-col)
 *   - Where in Code: Rendered inside the <div className="alert-list"> loop mapping over
 *     the alerts array derived from `useVendorDashboardData`.
 *
 * Purpose:
 *   Renders an individual notification / operational warning alert item
 *   inside the Vendor Critical Alerts panel:
 *     1. Displays the textual alert message describing the operational condition.
 *     2. Automatically infers an appropriate severity color theme (yellow, orange,
 *        red, blue) via semantic keyword analysis when no explicit type is provided.
 *     3. Renders a timestamp with an intuitive Clock icon for time-sensitive awareness.
 *
 * Props:
 *   @param {string} props.what_alert - Primary text message describing the operational alert
 *   @param {string} props.when - Human-readable timestamp or elapsed time string (e.g. "10m ago")
 *   @param {string} [props.type] - Optional explicit severity level: "yellow" | "orange" | "red" | "blue"
 * ============================================================================
 */

import React from "react";
import { Clock } from "lucide-react";

function AlertItem({ what_alert, when, type }) {
  // --------------------------------------------------------------------------
  // 1. SEVERITY LEVEL DETERMINATION & SEMANTIC HEURISTICS
  // --------------------------------------------------------------------------
  // If an explicit alert type is passed, use it directly. Otherwise, inspect
  // the text for operational keywords to automatically assign the color theme.
  let alertType = type;
  if (!alertType) {
    const text = (what_alert || "").toLowerCase();

    // Equipment / Inventory shortage warnings -> Yellow (Caution)
    if (text.includes("stock") || text.includes("equipment")) {
      alertType = "yellow";
    // Staffing / Capacity schedule conflicts -> Orange (Warning)
    } else if (text.includes("conflict") || text.includes("staff") || text.includes("capacity")) {
      alertType = "orange";
    // Urgent / Critical action items -> Red (Critical)
    } else if (text.includes("urgent") || text.includes("critical")) {
      alertType = "red";
    // General operational notices -> Blue (Informational)
    } else {
      alertType = "blue";
    }
  }

  // --------------------------------------------------------------------------
  // 2. RENDER COMPONENT
  // --------------------------------------------------------------------------
  return (
    <div className={`alert-item alert-item--${alertType}`}>
      {/* ── Alert Description Message ── */}
      <div className="alert-msg">{what_alert}</div>

      {/* ── Alert Timestamp & Clock Indicator ── */}
      <div className="alert-time">
        <Clock size={12} className="meta-icon" />
        <span>{when}</span>
      </div>
    </div>
  );
}

export default AlertItem;