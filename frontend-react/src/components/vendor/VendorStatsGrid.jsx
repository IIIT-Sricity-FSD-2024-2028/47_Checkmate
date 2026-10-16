/**
 * ============================================================================
 * VENDOR STATS GRID COMPONENT (VendorStatsGrid.jsx)
 * ============================================================================
 * Role: Reusable Component (Vendor Portal)
 * Location: src/components/vendor/VendorStatsGrid.jsx
 *
 * Purpose:
 *   Renders the 5 core KPI metric cards across the top of the Vendor Dashboard:
 *     1. Pending Requests: Unreviewed incoming bookings awaiting vendor review.
 *     2. Active Events: Live or confirmed ongoing events in the coordinator cycle.
 *     3. Total Events: All cumulative events registered to this vendor tenant.
 *     4. Completed Events: Successfully executed events.
 *     5. Net Earnings: Total vendor payout (calculated at 90% after platform fee).
 *
 * Reusable Components:
 *   - <StatisticCard>: Standard metric card component with icons and color themes.
 *
 * Props:
 *   @param {Object} props.stats - Calculated stats object
 *   @param {boolean} props.loading - Data loading state flag
 * ============================================================================
 */

import React from "react";
import {
  Calendar,
  CheckCircle2,
  DollarSign,
  Package,
  TrendingUp,
} from "lucide-react";
import StatisticCard from "../StatisticCard";

function VendorStatsGrid({ stats, loading }) {
  return (
    <div className="stats-grid" aria-label="Vendor KPI Overview">
      {/* ── Card 1: Pending Event Requests ── */}
      <StatisticCard
        value={loading ? "..." : String(stats.pendingRequests ?? 0)}
        title="Pending Requests"
        status="↗ Active"
        icon={Calendar}
        color="blue"
      />

      {/* ── Card 2: Active & Live Events ── */}
      <StatisticCard
        value={loading ? "..." : String(stats.activeEvents ?? 0)}
        title="Active Events"
        status="↗ Live"
        icon={TrendingUp}
        color="green"
      />

      {/* ── Card 3: Total Cumulative Events ── */}
      <StatisticCard
        value={loading ? "..." : String(stats.totalEvents ?? 0)}
        title="Total Events"
        status="All"
        icon={Package}
        color="purple"
      />

      {/* ── Card 4: Completed Historical Events ── */}
      <StatisticCard
        value={loading ? "..." : String(stats.completedEvents ?? 0)}
        title="Completed Events"
        status="Done"
        icon={CheckCircle2}
        color="orange"
      />

      {/* ── Card 5: Net Payout Earnings (90% Vendor Share) ── */}
      <StatisticCard
        value={loading ? "..." : stats.netEarnings || "$0.00"}
        title="Net Earnings"
        status="90% Net Payout"
        icon={DollarSign}
        color="green"
      />
    </div>
  );
}

export default VendorStatsGrid;
