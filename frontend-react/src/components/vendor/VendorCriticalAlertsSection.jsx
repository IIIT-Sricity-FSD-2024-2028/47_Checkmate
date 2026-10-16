/**
 * ============================================================================
 * VENDOR CRITICAL ALERTS SECTION COMPONENT (VendorCriticalAlertsSection.jsx)
 * ============================================================================
 * Role: Reusable Component (Vendor Portal)
 * Location: src/components/vendor/VendorCriticalAlertsSection.jsx
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

import React from "react";
import AlertItem from "./AlertItem";

function VendorCriticalAlertsSection({ alerts = [], loading = false }) {
  return (
    <div className="card Alertitem-card">
      {/* ── Card Header with Warning Accent Icon ── */}
      <div className="card__header alerts-header">
        <span className="alert-icon">⚠</span>
        <h3>Critical Alerts</h3>
      </div>

      {/* ── Alerts List or Normal Operations Placeholder ── */}
      <div className="alert-list">
        {alerts.length > 0 ? (
          alerts.map((alert, index) => (
            <AlertItem
              key={index}
              what_alert={alert.what_alert}
              when={alert.when}
              type={alert.type}
            />
          ))
        ) : (
          <div className="card-empty-placeholder">
            {loading
              ? "Checking operations..."
              : "All operations normal — no critical alerts."}
          </div>
        )}
      </div>
    </div>
  );
}

export default VendorCriticalAlertsSection;
