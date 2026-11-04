/**
 * ============================================================================
 * VENDOR RECENT ACTIVITY ITEM COMPONENT (RecentActivityItem.jsx)
 * ============================================================================
 * Role: Atomic Presentation Component (Vendor Dashboard Portal)
 * Location: src/components/vendor/RecentActivityItem.jsx
 *
 * Parent / Invocation Context:
 *   - Called By: src/components/vendor/VendorRecentActivitySection.jsx (Lines 42–47)
 *   - Parent Page: Vendor Dashboard (src/pages/vendor/Dashboard.jsx, Component 4 in left-col)
 *   - Where in Code: Rendered inside the <div className="activity-list"> stream in
 *     VendorRecentActivitySection.jsx mapping over computed recent activities.
 *
 * Purpose:
 *   Renders an individual chronological event/audit log entry in the
 *   Vendor Recent Activity stream:
 *     1. Visual timeline indicator dot.
 *     2. Primary activity title (action performed).
 *     3. Subtext description (details, target event, or context).
 *     4. Relative timestamp indicating when the activity took place.
 *
 * Props:
 *   @param {string} props.activity - Headline label describing the action taken
 *   @param {string} props.description - Supplementary contextual description
 *   @param {string} props.when - Relative time string (e.g. "15m ago", "2h ago")
 * ============================================================================
 */

import React from "react";

function RecentActivityItem({ activity, description, when }) {
  return (
    <div className="activity-item">
      {/* ── Visual Timeline Indicator Dot ── */}
      <span className="activity-dot" />

      {/* ── Activity Content Body ── */}
      <div className="activity-body">
        <div className="activity-title">{activity}</div>
        <div className="activity-sub">{description}</div>
      </div>

      {/* ── Relative Timestamp ── */}
      <div className="activity-time">{when}</div>
    </div>
  );
}

export default RecentActivityItem;