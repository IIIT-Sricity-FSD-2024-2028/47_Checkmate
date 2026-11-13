/**
 * ============================================================================
 * VENDOR CRITICAL ALERT ITEM COMPONENT (AlertItem.jsx)
 * ============================================================================
 * Role: Atomic Presentation Component (Vendor Dashboard Portal)
 * Location: src/components/vendor/AlertItem.jsx
 *
 * Features:
 *   1. Displays primary alert headline and detailed description.
 *   2. Severity color indicators (red = critical, amber = caution, blue = notice).
 *   3. Actionable inline button ("Review now", "Resolve conflict", "Assign staff").
 *   4. Timestamp / contextual trigger indicator.
 * ============================================================================
 */

import React from "react";
import { Clock, ArrowRight, AlertTriangle, AlertCircle, Info } from "lucide-react";

function AlertItem({
  title,
  desc,
  what_alert,
  when,
  type,
  severity,
  actionLabel,
  onAction,
}) {
  // Normalize severity
  let finalSeverity = severity || type || "amber";
  if (finalSeverity === "orange" || finalSeverity === "yellow") finalSeverity = "amber";

  const headline = title || what_alert || "Operational Notice";
  const details = desc || "";

  // Visual severity theme styles
  let themeStyle = {
    background: "rgba(245, 158, 11, 0.08)",
    border: "1px solid rgba(245, 158, 11, 0.3)",
    badgeBg: "rgba(245, 158, 11, 0.2)",
    badgeColor: "#fde047",
    btnBg: "rgba(245, 158, 11, 0.18)",
    btnBorder: "rgba(245, 158, 11, 0.4)",
    btnColor: "#fde047",
    Icon: AlertTriangle,
  };

  if (finalSeverity === "red" || finalSeverity === "high") {
    themeStyle = {
      background: "rgba(239, 68, 68, 0.09)",
      border: "1px solid rgba(239, 68, 68, 0.35)",
      badgeBg: "rgba(239, 68, 68, 0.2)",
      badgeColor: "#fca5a5",
      btnBg: "rgba(239, 68, 68, 0.2)",
      btnBorder: "rgba(239, 68, 68, 0.45)",
      btnColor: "#fca5a5",
      Icon: AlertCircle,
    };
  } else if (finalSeverity === "blue" || finalSeverity === "info") {
    themeStyle = {
      background: "rgba(59, 130, 246, 0.08)",
      border: "1px solid rgba(59, 130, 246, 0.3)",
      badgeBg: "rgba(59, 130, 246, 0.2)",
      badgeColor: "#93c5fd",
      btnBg: "rgba(59, 130, 246, 0.18)",
      btnBorder: "rgba(59, 130, 246, 0.4)",
      btnColor: "#93c5fd",
      Icon: Info,
    };
  }

  const { Icon } = themeStyle;

  return (
    <div
      className="alert-item-container"
      style={{
        background: themeStyle.background,
        border: themeStyle.border,
        borderRadius: "10px",
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        transition: "transform 0.18s ease, border-color 0.18s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, flex: 1, minWidth: 0 }}>
          <Icon size={16} color={themeStyle.badgeColor} style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-primary, #f8fafc)", lineHeight: "1.3" }}>
              {headline}
            </div>
            {details && (
              <div style={{ fontSize: "12px", color: "var(--text-secondary, #cbd5e1)", marginTop: 3, lineHeight: "1.4" }}>
                {details}
              </div>
            )}
          </div>
        </div>

        <span
          style={{
            fontSize: "10px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            padding: "2px 7px",
            borderRadius: "12px",
            background: themeStyle.badgeBg,
            color: themeStyle.badgeColor,
            flexShrink: 0,
          }}
        >
          {finalSeverity === "red" ? "Critical" : finalSeverity === "amber" ? "Warning" : "Notice"}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 4, borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "11px", color: "var(--text-muted, #94a3b8)" }}>
          <Clock size={11} />
          <span>{when || "Just now"}</span>
        </div>

        {actionLabel && (
          <button
            type="button"
            onClick={onAction}
            aria-label={`${actionLabel}: ${headline}`}
            style={{
              background: themeStyle.btnBg,
              border: `1px solid ${themeStyle.btnBorder}`,
              borderRadius: "6px",
              color: themeStyle.btnColor,
              fontSize: "11px",
              fontWeight: 600,
              padding: "4px 9px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              transition: "opacity 0.15s ease",
            }}
          >
            <span>{actionLabel}</span>
            <ArrowRight size={11} />
          </button>
        )}
      </div>
    </div>
  );
}

export default AlertItem;