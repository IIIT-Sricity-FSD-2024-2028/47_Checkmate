/**
 * ============================================================================
 * VENDOR STAFF STATS GRID COMPONENT (StaffStatsGrid.jsx)
 * ============================================================================
 * Role: Modular KPI Metric Cards Grid (Vendor Staff Portal)
 * Location: src/components/vendor/StaffStatsGrid.jsx
 *
 * Parent / Invocation Context:
 *   - Called By: src/pages/vendor/ManageStaff.jsx
 *   - Parent Page: Vendor Manage Staff (src/pages/vendor/ManageStaff.jsx)
 *   - Where in Code: Positioned directly beneath <EventsToastFeedback> and above
 *     <StaffToolbar> in the staff management view.
 *
 * Purpose:
 *   Renders a 4-column summary metric grid displaying:
 *     1. Total staff members associated with the vendor.
 *     2. Active staff members available for event assignment.
 *     3. Busy staff members currently allocated to active events.
 *     4. Staff members nearing maximum capacity (workload >= 80%).
 *
 * Reusable Components Utilized:
 *   - <StatisticCard>: Standardized dashboard metric card component.
 *
 * Props:
 *   @param {Object} props.stats - Computed metrics { totalStaff, availableStaff, busyStaff, highWorkloadStaff }
 *   @param {boolean} [props.loading=false] - Whether data is actively loading
 * ============================================================================
 */

import React from "react";
import { Users, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import StatisticCard from "../StatisticCard";

function StaffStatsGrid({ stats = {}, loading = false }) {
  const {
    totalStaff = 0,
    availableStaff = 0,
    busyStaff = 0,
    highWorkloadStaff = 0,
  } = stats;

  return (
    <section className="mr-stat-grid" aria-label="Staff Team Summary Metrics">
      {/* ── Metric Card 1: Total Staff Members ── */}
      <StatisticCard
        title="Total Staff"
        value={loading ? "..." : String(totalStaff)}
        description="Active workforce roster"
        icon={Users}
        color="purple"
      />

      {/* ── Metric Card 2: Available Staff ── */}
      <StatisticCard
        title="Available"
        value={loading ? "..." : String(availableStaff)}
        description="Ready for event deployment"
        icon={CheckCircle2}
        color="green"
      />

      {/* ── Metric Card 3: Busy Staff ── */}
      <StatisticCard
        title="Busy / Assigned"
        value={loading ? "..." : String(busyStaff)}
        description="Engaged in event tasks"
        icon={Clock}
        color="orange"
      />

      {/* ── Metric Card 4: High Workload Alert ── */}
      <StatisticCard
        title="High Workload"
        value={loading ? "..." : String(highWorkloadStaff)}
        description="Capacity at 80% or higher"
        icon={AlertTriangle}
        color="red"
      />
    </section>
  );
}

export default React.memo(StaffStatsGrid);
