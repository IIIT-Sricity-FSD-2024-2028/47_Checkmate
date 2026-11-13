/**
 * ============================================================================
 * VENDOR CRITICAL ALERTS SECTION COMPONENT (VendorCriticalAlertsSection.jsx)
 * ============================================================================
 * Role: Reusable Component (Vendor Portal)
 * Location: src/components/vendor/VendorCriticalAlertsSection.jsx
 *
 * Parent / Invocation Context:
 *   - Called By: src/pages/vendor/Dashboard.jsx (Lines 101–104)
 *   - Parent Page: Vendor Dashboard (src/pages/vendor/Dashboard.jsx, Component 5 in right-col)
 *   - Where in Code: Positioned in the right-hand column of the Dashboard grid
 *     directly above <VendorQuickActionsSection>, hosting the <AlertItem> list.
 *
 * Purpose:
 *   Renders the Critical Operational Alerts card on the Vendor Dashboard:
 *     - Proactively flags operational bottlenecks:
 *         • Event requests awaiting review (Action Required)
 *         • Low or depleted inventory resources (Inventory Check)
 *         • Staff members nearing capacity (>80% workload)
 *     - Renders a clean "All operations normal" empty state when no alerts exist.
 *
 * Reusable Components:
 *   - <AlertItem>: Alert item with color-coded severity pill and clock icon.
 *
 * Props:
 *   @param {Array} props.alerts - List of operational alert objects:
 *     [{ what_alert, when, type }]
 *   @param {boolean} props.loading - Data loading state flag
 * ============================================================================
 */

/**
 * ============================================================================
 * VENDOR CRITICAL ALERTS SECTION COMPONENT (VendorCriticalAlertsSection.jsx)
 * ============================================================================
 * Role: Reusable Component (Vendor Portal)
 * Location: src/components/vendor/VendorCriticalAlertsSection.jsx
 *
 * Features:
 *   1. Warning icon positioned on the left next to title + count badge.
 *   2. Actionable operational alerts with severity colors (red / amber / blue).
 *   3. Inline actionable buttons ("Review now", "Resolve conflict", "Assign staff").
 *   4. Surfaces venue collisions, unassigned shifts, staff overloads, and low stock.
 *   5. Polished "All clear" empty state filling panel space.
 *   6. Loading skeleton placeholders.
 * ============================================================================
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import AlertItem from "./AlertItem";

function VendorCriticalAlertsSection({ alerts = [], loading = false }) {
  const navigate = useNavigate();

  return (
    <div className="card Alertitem-card" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* ── Card Header with Warning Accent Icon on the Left & Count Badge ── */}
      <div
        className="card__header alerts-header"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border, rgba(255, 255, 255, 0.08))",
          paddingBottom: 12,
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "8px",
              background: alerts.length > 0 ? "rgba(239, 68, 68, 0.18)" : "rgba(34, 197, 94, 0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: alerts.length > 0 ? "#ef4444" : "#22c55e",
            }}
          >
            {alerts.length > 0 ? <AlertTriangle size={16} /> : <ShieldCheck size={16} />}
          </div>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>Critical Alerts</h3>
        </div>

        {/* Dynamic Count Badge */}
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            padding: "3px 9px",
            borderRadius: "20px",
            background: alerts.length > 0 ? "rgba(239, 68, 68, 0.2)" : "rgba(34, 197, 94, 0.2)",
            color: alerts.length > 0 ? "#fca5a5" : "#86efac",
            border: `1px solid ${alerts.length > 0 ? "rgba(239, 68, 68, 0.4)" : "rgba(34, 197, 94, 0.4)"}`,
          }}
        >
          {alerts.length} {alerts.length === 1 ? "Alert" : "Alerts"}
        </span>
      </div>

      {/* ── Alerts List or Full "All Clear" Empty State ── */}
      <div className="alert-list" style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        {loading ? (
          // Loading Skeletons
          [1, 2].map((i) => (
            <div
              key={i}
              style={{
                padding: "12px 14px",
                borderRadius: "10px",
                background: "rgba(255, 255, 255, 0.02)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div className="skeleton-block" style={{ width: 140, height: 16 }} />
              <div className="skeleton-block" style={{ width: 220, height: 12 }} />
            </div>
          ))
        ) : alerts.length > 0 ? (
          alerts.slice(0, 5).map((alert, index) => (
            <AlertItem
              key={alert.id || index}
              title={alert.title}
              desc={alert.desc}
              what_alert={alert.what_alert}
              when={alert.when}
              type={alert.type}
              severity={alert.severity}
              actionLabel={alert.actionLabel || "Review now"}
              onAction={() => {
                if (alert.actionPath) navigate(alert.actionPath);
                else navigate("/vendor/events");
              }}
            />
          ))
        ) : (
          /* Polished "All Clear" Empty State filling panel height */
          <div
            className="card-empty-placeholder"
            style={{
              flex: 1,
              minHeight: 180,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "24px 16px",
              background: "rgba(34, 197, 94, 0.04)",
              border: "1px dashed rgba(34, 197, 94, 0.25)",
              borderRadius: "12px",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "rgba(34, 197, 94, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#86efac",
                marginBottom: 2,
              }}
            >
              <CheckCircle2 size={24} />
            </div>
            <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-primary, #f8fafc)" }}>
              All Clear
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary, #cbd5e1)", maxWidth: 240, lineHeight: 1.4 }}>
              No double-booked venues, staffing shortages, or low inventory issues detected.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VendorCriticalAlertsSection;
