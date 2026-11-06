/**
 * ============================================================================
 * BILLING STATS GRID (BillingStatsGrid.jsx)
 * ============================================================================
 * Role: KPI Metric Cards (Client Billing page)
 * Location: src/components/client/BillingStatsGrid.jsx
 *
 * Purpose:
 *   3 summary cards above the invoice table:
 *     1. Outstanding Balance (with the next due date)
 *     2. Total Paid (across N events)
 *     3. Active Invoices (still have a balance)
 *
 * Props:
 *   @param {Object} summary - { outstanding, totalPaid, unpaidCount, invoiceCount, nextDue }
 *   @param {boolean} loading - Loading indicator
 * ============================================================================
 */

import React from "react";
import { CheckCircle2, DollarSign, Receipt } from "lucide-react";
import StatisticCard from "../StatisticCard";
import { formatDate, money } from "../../utils/clientHelpers";

function BillingStatsGrid({ summary, loading }) {
  return (
    <div className="stats-grid cl-stats-3" aria-label="Billing Overview">
      <StatisticCard title="Outstanding Balance" value={loading ? "..." : money(summary.outstanding)}
        description={summary.nextDue ? `Due ${formatDate(summary.nextDue, "long")}` : "Nothing due"}
        icon={DollarSign} color="purple" />
      <StatisticCard title="Total Paid" value={loading ? "..." : money(summary.totalPaid)}
        description={`Across ${summary.invoiceCount} total events`}
        icon={CheckCircle2} color="green" />
      <StatisticCard title="Active Invoices" value={loading ? "..." : String(summary.unpaidCount)}
        description="Awaiting partial payment"
        icon={Receipt} color="blue" />
    </div>
  );
}

export default BillingStatsGrid;
