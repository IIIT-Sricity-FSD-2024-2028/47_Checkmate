/**
 * ============================================================================
 * VENDOR RECENT ACTIVITY SECTION COMPONENT (VendorRecentActivitySection.jsx)
 * ============================================================================
 * Role: Reusable Component (Vendor Portal)
 * Location: src/components/vendor/VendorRecentActivitySection.jsx
 *
 * Features:
 *   1. Chronological activity stream with unified relative timestamps.
 *   2. Activity icons and colored indicator dots by type.
 *   3. Sanitized test data without messy internal IDs.
 *   4. "View all" expandable drawer/link.
 *   5. Empty state and loading skeleton placeholders.
 * ============================================================================
 */

import React, { useState } from "react";
import { Activity, ChevronDown, ChevronUp } from "lucide-react";
import RecentActivityItem from "./RecentActivityItem";

function VendorRecentActivitySection({ activities = [], loading = false }) {
  const [showAll, setShowAll] = useState(false);

  const displayedList = showAll ? activities : activities.slice(0, 4);

  return (
    <div className="card Recent-Activity-card">
      {/* ── Card Header with View All Link ── */}
      <div
        className="card__header"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border, rgba(255, 255, 255, 0.08))",
          paddingBottom: 12,
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Activity size={17} color="#a855f7" />
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>Recent Activity</h3>
        </div>

        {activities.length > 4 && (
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            style={{
              background: "transparent",
              border: "none",
              color: "#e91e8c",
              fontSize: "12.5px",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span>{showAll ? "Show Less" : "View All"}</span>
            {showAll ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      {/* ── Activity Stream List or Empty State ── */}
      <div className="activity-list" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {loading ? (
          // Loading skeletons
          [1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                background: "rgba(255, 255, 255, 0.02)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div className="skeleton-block" style={{ width: 32, height: 32, borderRadius: "50%" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div className="skeleton-block" style={{ width: 140, height: 14 }} />
                  <div className="skeleton-block" style={{ width: 190, height: 11 }} />
                </div>
              </div>
              <div className="skeleton-block" style={{ width: 45, height: 12 }} />
            </div>
          ))
        ) : displayedList.length > 0 ? (
          displayedList.map((act, index) => (
            <RecentActivityItem
              key={index}
              activity={act.activity}
              description={act.description}
              when={act.when}
              type={act.type}
              category={act.category}
            />
          ))
        ) : (
          <div
            className="card-empty-placeholder"
            style={{
              padding: "32px 16px",
              textAlign: "center",
              color: "var(--text-muted, #94a3b8)",
              fontSize: "13px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Activity size={26} color="rgba(255, 255, 255, 0.2)" />
            <span>No recent activity recorded yet. Actions taken will appear here.</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default VendorRecentActivitySection;
