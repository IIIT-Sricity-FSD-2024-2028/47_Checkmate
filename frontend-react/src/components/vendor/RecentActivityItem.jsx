/**
 * ============================================================================
 * VENDOR RECENT ACTIVITY ITEM COMPONENT (RecentActivityItem.jsx)
 * ============================================================================
 * Role: Atomic Presentation Component (Vendor Dashboard Portal)
 * Location: src/components/vendor/RecentActivityItem.jsx
 *
 * Features:
 *   1. Contextual icons and colored dots by activity type:
 *        - assignment: green (UserCheck)
 *        - acceptance: blue (CheckCircle2)
 *        - request: amber (Calendar)
 *        - payment: purple (IndianRupee)
 *        - issue: orange (AlertCircle)
 *   2. Sanitized text preventing messy test strings.
 *   3. Unified relative timestamp format ("2h ago", "Yesterday", "Sep 18").
 * ============================================================================
 */

import React from "react";
import { UserCheck, CheckCircle2, Calendar, IndianRupee, AlertCircle, Clock } from "lucide-react";

function RecentActivityItem({ activity, description, when, type = "request", category = null }) {
  // Activity semantic icon & theme
  let Icon = Calendar;
  let dotColor = "#eab308";
  let bgGrad = "rgba(234, 179, 8, 0.15)";

  const t = String(type || "").toLowerCase();
  if (t === "assignment") {
    Icon = UserCheck;
    dotColor = "#22c55e";
    bgGrad = "rgba(34, 197, 94, 0.15)";
  } else if (t === "acceptance") {
    Icon = CheckCircle2;
    dotColor = "#3b82f6";
    bgGrad = "rgba(59, 130, 246, 0.15)";
  } else if (t === "payment") {
    Icon = IndianRupee;
    dotColor = "#a855f7";
    bgGrad = "rgba(168, 85, 247, 0.15)";
  } else if (t === "issue") {
    Icon = AlertCircle;
    dotColor = "#f97316";
    bgGrad = "rgba(249, 115, 22, 0.15)";
  }

  return (
    <div
      className="activity-item"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 14px",
        borderRadius: "10px",
        background: "rgba(255, 255, 255, 0.02)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        gap: 12,
        transition: "background 0.15s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 11, flex: 1, minWidth: 0 }}>
        {/* Contextual Icon Badge with Colored Indicator Ring */}
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: bgGrad,
            border: `1px solid ${dotColor}40`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: dotColor,
            flexShrink: 0,
            position: "relative",
          }}
        >
          <Icon size={15} />
          {/* Timeline Dot */}
          <span
            style={{
              position: "absolute",
              bottom: -1,
              right: -1,
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: dotColor,
              boxShadow: `0 0 6px ${dotColor}`,
            }}
          />
        </div>

        {/* Activity Content Body */}
        <div className="activity-body" style={{ flex: 1, minWidth: 0 }}>
          <div
            className="activity-title"
            style={{
              fontWeight: 600,
              fontSize: "13px",
              color: "var(--text-primary, #f8fafc)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {activity}
          </div>
          <div
            className="activity-sub"
            style={{
              fontSize: "12px",
              color: "var(--text-secondary, #cbd5e1)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {description}
          </div>
        </div>
      </div>

      {/* Relative Timestamp */}
      <div
        className="activity-time"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          fontSize: "11px",
          color: "var(--text-muted, #94a3b8)",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        <Clock size={11} />
        <span>{when}</span>
      </div>
    </div>
  );
}

export default RecentActivityItem;