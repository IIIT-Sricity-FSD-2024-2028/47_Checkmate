/**
 * ============================================================================
 * CLIENT STATS GRID COMPONENT (ClientStatsGrid.jsx)
 * ============================================================================
 * Role: Reusable Component (Client Portal)
 * Location: src/components/client/ClientStatsGrid.jsx
 *
 * Purpose:
 *   Renders the 4 KPI cards across the top of the Client Dashboard:
 *     1. Active Events: confirmed, approved or live events.
 *     2. Pending Requests: waiting for vendor approval.
 *     3. Total Events: everything this client has submitted.
 *     4. Completed Events: finished events.
 *
 * Reusable Components:
 *   - <StatisticCard>: Standard metric card shared with the vendor dashboard.
 *
 * Props:
 *   @param {Object} props.stats - { active, live, pending, total, completed }
 *   @param {boolean} props.loading - Shows "..." while data loads
 * ============================================================================
 */

import React from "react";
import { CalendarCheck, CheckCircle2, Hourglass, Rocket } from "lucide-react";
import StatisticCard from "../StatisticCard";

function ClientStatsGrid({ stats, loading }) {
  const show = (value) => (loading ? "..." : String(value ?? 0));

  return (
    <div className="stats-grid cl-stats-4" aria-label="Client KPI Overview">
      {/* ── Card 1: Active & Live Events ── */}
      <StatisticCard
        title="Active Events"
        value={show(stats.active)}
        status={stats.live > 0 ? `${stats.live} Live` : "Ready"}
        description="Events currently live or approved"
        icon={Rocket}
        color="blue"
      />

      {/* ── Card 2: Pending Requests ── */}
      <StatisticCard
        title="Pending Requests"
        value={show(stats.pending)}
        status="Awaiting"
        description="Awaiting vendor approval"
        icon={Hourglass}
        color="orange"
      />

      {/* ── Card 3: All Submitted Events ── */}
      <StatisticCard
        title="Total Events"
        value={show(stats.total)}
        status="All"
        description="All events you've submitted"
        icon={CalendarCheck}
        color="purple"
      />

      {/* ── Card 4: Completed Events ── */}
      <StatisticCard
        title="Completed Events"
        value={show(stats.completed)}
        status="Done"
        description="Successfully finished events"
        icon={CheckCircle2}
        color="green"
      />
    </div>
  );
}

export default ClientStatsGrid;
