/**
 * ============================================================================
 * VENDOR PRESET PACKAGES STATS GRID (PackageStatsGrid.jsx)
 * ============================================================================
 * Role: Modular KPI Metric Cards Grid (Vendor Packages Portal)
 * Location: src/components/vendor/PackageStatsGrid.jsx
 *
 * Purpose:
 *   Renders a 4-column summary metric grid displaying:
 *     1. Total catalogued event preset packages.
 *     2. Active & approved packages ready for client booking.
 *     3. Average bundle pricing across the vendor's catalog.
 *     4. Primary / highest volume event package category.
 *
 * Reusable Components Utilized:
 *   - <StatisticCard>: Global reusable metric card component.
 *
 * Props:
 *   @param {Object} stats - Computed metrics { total, active, avgPrice, topCategory }
 *   @param {boolean} loading - Loading state indicator
 * ============================================================================
 */

import React from "react";
import { Package, CheckCircle2, DollarSign, TrendingUp } from "lucide-react";
import StatisticCard from "../StatisticCard";

function PackageStatsGrid({ stats = {}, loading = false }) {
  const {
    total = 0,
    active = 0,
    avgPrice = "$0",
    topCategory = "General",
  } = stats;

  return (
    <section className="events-stats-grid" aria-label="Preset Packages Summary Metrics">
      {/* ── Metric Card 1: Total Catalogued Packages ── */}
      <StatisticCard
        title="Total Packages"
        value={loading ? "..." : String(total)}
        status="Catalog"
        description="All configured preset bundles"
        icon={Package}
        color="purple"
      />

      {/* ── Metric Card 2: Active & Approved ── */}
      <StatisticCard
        title="Active Packages"
        value={loading ? "..." : String(active)}
        status="Ready to Book"
        description="Publicly available to clients"
        icon={CheckCircle2}
        color="green"
      />

      {/* ── Metric Card 3: Average Bundle Price ── */}
      <StatisticCard
        title="Average Price"
        value={loading ? "..." : avgPrice}
        status="Catalog Average"
        description="Mean turnaround package price"
        icon={DollarSign}
        color="blue"
      />

      {/* ── Metric Card 4: Dominant Category ── */}
      <StatisticCard
        title="Primary Category"
        value={loading ? "..." : topCategory}
        status="Top Focus"
        description="Largest segment of package portfolio"
        icon={TrendingUp}
        color="orange"
      />
    </section>
  );
}

export default PackageStatsGrid;
