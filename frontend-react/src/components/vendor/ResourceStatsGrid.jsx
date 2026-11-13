/**
 * ============================================================================
 * RESOURCE STATS GRID COMPONENT (ResourceStatsGrid.jsx)
 * ============================================================================
 * Role: Modular KPI Metric Cards Grid (Vendor Inventory Portal)
 * Location: src/components/vendor/ResourceStatsGrid.jsx
 *
 * Parent / Invocation Context:
 *   - Called By: src/pages/vendor/ManageResource.jsx
 *   - Parent Page: Vendor Manage Resources (src/pages/vendor/ManageResource.jsx)
 *   - Where in Code: Positioned directly beneath <EventsToastFeedback> and above
 *     <ResourceToolbar> in the inventory management view.
 *
 * Purpose:
 *   Renders a 4-column summary metric grid displaying:
 *     1. Total distinct inventory resources registered in the catalog.
 *     2. Total units available for deployment across all resources.
 *     3. Low stock alert items (1 to 10 units remaining).
 *     4. Out of stock alert items (0 units or flagged unavailable).
 *
 * Reusable Components Utilized:
 *   - <StatisticCard>: Standardized dashboard metric card component.
 *
 * Props:
 *   @param {Object} props.stats - Computed metrics { totalItems, totalAvailableUnits, lowStockCount, outOfStockCount }
 *   @param {boolean} [props.loading=false] - Whether inventory data is currently being fetched
 * ============================================================================
 */

import React from "react";
import { Package, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import StatisticCard from "../StatisticCard";

function ResourceStatsGrid({ stats = {}, loading = false }) {
  const {
    totalItems = 0,
    totalAvailableUnits = 0,
    lowStockCount = 0,
    outOfStockCount = 0,
  } = stats;

  return (
    <section className="mr-stat-grid" aria-label="Inventory Summary Statistics">
      {/* ── Metric Card 1: Total distinct resource items ── */}
      <StatisticCard
        title="Total Resources"
        value={loading ? "..." : String(totalItems)}
        description="Active inventory catalog"
        icon={Package}
        color="purple"
      />

      {/* ── Metric Card 2: Total available units across catalog ── */}
      <StatisticCard
        title="Available Stock"
        value={loading ? "..." : String(totalAvailableUnits)}
        description="Units ready for deployment"
        icon={CheckCircle2}
        color="green"
      />

      {/* ── Metric Card 3: Items approaching low stock threshold ── */}
      <StatisticCard
        title="Low Stock Alert"
        value={loading ? "..." : String(lowStockCount)}
        description="Items with 1–10 units left"
        icon={AlertTriangle}
        color="orange"
      />

      {/* ── Metric Card 4: Items completely depleted ── */}
      <StatisticCard
        title="Out of Stock"
        value={loading ? "..." : String(outOfStockCount)}
        description="Items needing replenishment"
        icon={XCircle}
        color="red"
      />
    </section>
  );
}

export default React.memo(ResourceStatsGrid);
