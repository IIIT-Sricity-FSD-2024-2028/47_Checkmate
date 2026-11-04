/**
 * ============================================================================
 * VENDOR EVENTS KPI STATS GRID (EventsStatsGrid.jsx)
 * ============================================================================
 * Role: Modular KPI Metric Cards Grid (Vendor Events Portal)
 * Location: src/components/vendor/EventsStatsGrid.jsx
 *
 * Parent / Invocation Context:
 *   - Called By: src/pages/vendor/Events.jsx (Lines 99–102)
 *   - Also Reused In: src/pages/client/MyEvents.jsx
 *   - Parent Page: Vendor Event Requests (src/pages/vendor/Events.jsx, Component 2)
 *   - Where in Code: Positioned directly below <EventsToastFeedback> and above
 *     <EventsToolbar> in the Event Requests page layout.
 *
 * Purpose:
 *   Renders a balanced 4-column summary metric grid displaying:
 *     1. Total cumulative event requests submitted to the vendor.
 *     2. Pending requests requiring operational approval or review.
 *     3. Confirmed scheduled events in the execution pipeline.
 *     4. Currently active / live events in progress.
 *
 * Reusable Components Utilized:
 *   - <StatisticCard>: Global reusable metric card component.
 *
 * Props:
 *   @param {Object} stats - Computed metrics { total, pending, confirmed, live }
 *   @param {boolean} loading - Loading indicator
 * ============================================================================
 */

import React from "react";
import { Package, Clock, CheckCircle2, TrendingUp } from "lucide-react";
import StatisticCard from "../StatisticCard";

function EventsStatsGrid({ stats = {}, loading = false }) {
  const {
    total = 0,
    pending = 0,
    confirmed = 0,
    live = 0,
  } = stats;

  return (
    <section className="stats-grid events-stats-grid" aria-label="Event Requests Overview">
      {/* ── Metric Card 1: Total Event Requests ── */}
      <StatisticCard
        title="Total Requests"
        value={loading ? "..." : String(total)}
        status="All Pipeline"
        description="Cumulative vendor event submissions"
        icon={Package}
        color="purple"
      />

      {/* ── Metric Card 2: Pending Operational Review ── */}
      <StatisticCard
        title="Pending Review"
        value={loading ? "..." : String(pending)}
        status={pending > 0 ? "Action Required" : "Up to Date"}
        description="Awaiting vendor acceptance or decline"
        icon={Clock}
        color="blue"
      />

      {/* ── Metric Card 3: Confirmed / Approved Events ── */}
      <StatisticCard
        title="Confirmed Events"
        value={loading ? "..." : String(confirmed)}
        status="Scheduled"
        description="Ready for resource & staff deployment"
        icon={CheckCircle2}
        color="green"
      />

      {/* ── Metric Card 4: Currently Live / In Progress ── */}
      <StatisticCard
        title="Live Events"
        value={loading ? "..." : String(live)}
        status={live > 0 ? "Executing" : "Idle"}
        description="Events actively taking place today"
        icon={TrendingUp}
        color="orange"
      />
    </section>
  );
}

export default EventsStatsGrid;
