/**
 * ============================================================================
 * VENDOR RECENT ACTIVITY SECTION COMPONENT (VendorRecentActivitySection.jsx)
 * ============================================================================
 * Role: Reusable Component (Vendor Portal)
 * Location: src/components/vendor/VendorRecentActivitySection.jsx
 *
 * Purpose:
 *   Renders the Recent Activity stream card on the Vendor Dashboard:
 *     - Displays a real-time chronological log of actions:
 *         • Staff responses & assignments
 *         • Event lifecycle transitions (live, confirmed, requested)
 *         • Support and issue tickets logged
 *     - Handles loading and empty states cleanly.
 *
 * Reusable Components:
 *   - <RecentActivityItem>: Item row with dot accent, title, description, and relative time.
 *
 * Props:
 *   @param {Array} props.activities - Derived list of activity objects:
 *     [{ activity, description, when }]
 *   @param {boolean} props.loading - Data loading state flag
 * ============================================================================
 */

import React from "react";
import RecentActivityItem from "./RecentActivityItem";

function VendorRecentActivitySection({ activities = [], loading = false }) {
  return (
    <div className="card Recent-Activity-card">
      {/* ── Card Header ── */}
      <div className="card__header">
        <h3>Recent Activity</h3>
      </div>

      {/* ── Activity Stream List or Empty State ── */}
      <div className="activity-list">
        {activities.length > 0 ? (
          activities.map((act, index) => (
            <RecentActivityItem
              key={index}
              activity={act.activity}
              description={act.description}
              when={act.when}
            />
          ))
        ) : (
          <div className="card-empty-placeholder">
            {loading ? "Loading recent activity..." : "No recent activity recorded."}
          </div>
        )}
      </div>
    </div>
  );
}

export default VendorRecentActivitySection;
