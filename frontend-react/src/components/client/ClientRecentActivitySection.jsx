/**
 * ============================================================================
 * CLIENT RECENT ACTIVITY SECTION COMPONENT (ClientRecentActivitySection.jsx)
 * ============================================================================
 * Role: Reusable Component (Client Portal)
 * Location: src/components/client/ClientRecentActivitySection.jsx
 *
 * Purpose:
 *   Renders the "Account Activity" card on the Client Dashboard:
 *     - One row per recent event with a coloured status dot
 *       (red = live/rejected, green = approved, grey = completed, blue = new).
 *     - Loading and empty states.
 *
 * Props:
 *   @param {Array} props.activities - [{ id, title, sub, color, date }]
 *   @param {boolean} props.loading - Data loading flag
 * ============================================================================
 */

import React from "react";
import { formatDate } from "../../utils/clientHelpers";

function ClientRecentActivitySection({ activities = [], loading = false }) {
  return (
    <div className="card">
      {/* ── Card Header ── */}
      <div className="card__header">
        <h3>Account Activity</h3>
      </div>

      {/* ── Activity rows or empty state ── */}
      <div className="activity-list">
        {activities.length === 0 && (
          <div className="cl-client-muted">{loading ? "Loading activity..." : "No recent activity"}</div>
        )}
        {activities.map((item) => (
          <div className="activity-item" key={item.id}>
            <span className="activity-dot" style={{ background: item.color }} />
            <div className="activity-body">
              <div className="activity-title">{item.title}</div>
              <div className="activity-sub">{item.sub}</div>
            </div>
            <div className="activity-time">{formatDate(item.date)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ClientRecentActivitySection;
