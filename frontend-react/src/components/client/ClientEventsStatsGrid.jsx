/**
 * ============================================================================
 * CLIENT EVENTS KPI STATS GRID (ClientEventsStatsGrid.jsx)
 * ============================================================================
 * Role: Modular KPI Metric Cards Grid (Client My Events page)
 * Location: src/components/client/ClientEventsStatsGrid.jsx
 *
 * Purpose:
 *   4-column summary above the events table:
 *     1. Total events submitted by the client.
 *     2. Pending requests waiting on the vendor.
 *     3. Approved events being prepared.
 *     4. Live events happening now.
 *
 * Reusable Components Utilized:
 *   - <StatisticCard>: Global reusable metric card component.
 *
 * Props:
 *   @param {Object} stats - { total, pending, approved, live }
 *   @param {boolean} loading - Loading indicator
 * ============================================================================
 */

import React from "react";
import { CalendarCheck, CheckCircle2, Clock, Radio } from "lucide-react";
import StatisticCard from "../StatisticCard";

function ClientEventsStatsGrid({ stats = {}, loading = false }) {
  const { total = 0, pending = 0, approved = 0, live = 0 } = stats;
  const show = (value) => (loading ? "..." : String(value));

  return (
    <section className="stats-grid cl-stats-4" aria-label="My Events Overview">
      <StatisticCard title="Total Events" value={show(total)} status="All"
        description="Every request you've submitted" icon={CalendarCheck} color="purple" />
      <StatisticCard title="Pending Approval" value={show(pending)} status={pending > 0 ? "Awaiting" : "None"}
        description="Waiting for the vendor to review" icon={Clock} color="blue" />
      <StatisticCard title="Approved Events" value={show(approved)} status="Scheduled"
        description="Resources and staff being prepared" icon={CheckCircle2} color="green" />
      <StatisticCard title="Live Now" value={show(live)} status={live > 0 ? "Happening" : "Idle"}
        description="Events taking place right now" icon={Radio} color="orange" />
    </section>
  );
}

export default ClientEventsStatsGrid;
