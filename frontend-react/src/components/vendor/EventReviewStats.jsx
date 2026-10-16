/**
 * ============================================================================
 * EVENT REVIEW STATS COMPONENT (EventReviewStats.jsx)
 * ============================================================================
 * Role: Reusable Component (Vendor Portal)
 * Location: src/components/vendor/EventReviewStats.jsx
 *
 * Purpose:
 *   Renders a 4-card metric overview for the event using the reusable
 *   StatisticCard component:
 *     1. Scheduled Date & Time
 *     2. Expected Attendees (Guest count)
 *     3. Resource Feasibility Status (In Stock vs Shortage)
 *     4. Staffing Feasibility Status (Ready vs Shortage)
 *
 * Props:
 *   @param {Object} props.event - The active event data
 *   @param {boolean} props.allResourcesAvailable - Whether all required resources are in stock
 *   @param {boolean} props.allStaffAvailable - Whether all required staff are assigned/available
 *   @param {Array} props.resourceRequirements - Parsed resource requirements list
 *   @param {Array} props.staffRequirements - Parsed staff requirements list
 * ============================================================================
 */

import React from "react";
import { Calendar, Users, Package, ShieldCheck } from "lucide-react";
import StatisticCard from "../StatisticCard";

function EventReviewStats({
  event,
  allResourcesAvailable,
  allStaffAvailable,
  resourceRequirements = [],
  staffRequirements = [],
}) {
  if (!event) return null;

  // Calculate counts for descriptive metric subtext
  const availableResCount = resourceRequirements.filter((r) => r.isSufficient).length;
  const availableStaffCount = staffRequirements.filter((s) => s.isAvailable).length;

  return (
    <div className="mr-stat-grid" aria-label="Event Feasibility Summary Cards">
      {/* ── Card 1: Event Scheduled Date & Time ── */}
      <StatisticCard
        title="Scheduled Date"
        value={event.date || "Date TBD"}
        description={event.time ? `Starts at ${event.time}` : "Time TBD"}
        icon={Calendar}
        color="blue"
      />

      {/* ── Card 2: Expected Attendees / Guest Capacity ── */}
      <StatisticCard
        title="Expected Attendees"
        value={event.people || event.guests || event.attendees || "—"}
        description="Guest capacity"
        icon={Users}
        color="purple"
      />

      {/* ── Card 3: Resources Feasibility (Green if in stock, Red if deficit) ── */}
      <StatisticCard
        title="Resources Status"
        value={allResourcesAvailable ? "In Stock" : "Shortage"}
        description={`${availableResCount} of ${resourceRequirements.length} available`}
        icon={Package}
        color={allResourcesAvailable ? "green" : "red"}
      />

      {/* ── Card 4: Staffing Feasibility (Green if ready, Red if deficit) ── */}
      <StatisticCard
        title="Staffing Status"
        value={allStaffAvailable ? "Ready" : "Shortage"}
        description={`${availableStaffCount} of ${staffRequirements.length} ready`}
        icon={ShieldCheck}
        color={allStaffAvailable ? "green" : "red"}
      />
    </div>
  );
}

export default EventReviewStats;
