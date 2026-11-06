/**
 * ============================================================================
 * CLIENT DASHBOARD DATA HOOK (useClientDashboardData.js)
 * ============================================================================
 * Role: Custom Data Retrieval & Transformation Hook (Client Portal)
 * Location: src/components/client/useClientDashboardData.js
 *
 * Purpose:
 *   Handles all data fetching and computation for the Client Dashboard:
 *     1. Loads the client's events, resource allocations, staff assignments
 *        and live phase progress in parallel (Promise.all).
 *     2. Computes the 4 KPI numbers (active, pending, total, completed).
 *     3. Picks the "next event" to highlight and builds its 5 timeline steps.
 *     4. Builds the recent activity feed from the latest 4 events.
 *     5. Re-fetches every REFRESH_MS so vendor changes appear without a reload.
 *
 * Connected Backend Endpoints:
 *   - GET /api/events                    -> filtered to this client by getMyEvents()
 *   - GET /api/state/resourceAllocations -> which events have resources allocated
 *   - GET /api/staff-assignments         -> which events have staff accepted
 *   - GET /api/state/monitorProgress     -> live setup / registration / event %
 *
 * Returns:
 *   @returns {Object} { loading, error, stats, nextEvent, progress, steps, activities }
 * ============================================================================
 */

import { useEffect, useMemo, useState } from "react";
import { getMyEvents } from "../../services/eventService";
import { getStaffAssignments } from "../../services/staffService";
import { getResourceAllocations, getMonitorProgress } from "../../services/stateService";
import { getEventProgress, describeError, REFRESH_MS } from "../../utils/clientHelpers";

/**
 * Picks the event to highlight: live first, then approved, then pending,
 * ties broken by the earliest date.
 * FACULTY MAY ASK: Why are completed and rejected events skipped?
 * HOW TO CHANGE: They have nothing left to track. Remove them from the filter to include them.
 */
function pickNextEvent(events) {
  const rank = { live: 1, confirmed: 2, approved: 2, pending: 3 };
  const open = events.filter((e) => e.status !== "completed" && e.status !== "rejected");
  open.sort((a, b) => {
    const rankDiff = (rank[a.status] || 4) - (rank[b.status] || 4);
    if (rankDiff !== 0) return rankDiff;
    return new Date(a.date) - new Date(b.date);
  });
  return open[0] || null;
}

/** Builds the 5 dashboard timeline steps for one event */
function buildSteps(event, progress, monitor) {
  const isLive = event.status === "live";

  // While live, show the setup / registration / event percentages
  let executionDesc = "Live Monitoring";
  if (isLive) {
    const phases = monitor[event.id] || {};
    const parts = [];
    if (phases.setup > 0) parts.push(`Setup: ${phases.setup}%`);
    if (phases.registration > 0) parts.push(`Reg: ${phases.registration}%`);
    if (phases.event > 0) parts.push(`Event: ${phases.event}%`);
    executionDesc = parts.length > 0 ? parts.join(" • ") : "Event is currently live";
  }

  return [
    { title: "Submitted", desc: "Request received", done: true },
    { title: "Approval", desc: "Vendor coordinator review", done: progress.isApproved },
    { title: "Resources", desc: "Equipment & Supplies", done: progress.hasResources },
    { title: "Staffing", desc: "Team assignment", done: progress.hasStaff },
    { title: "Execution", desc: executionDesc, done: isLive || event.status === "completed", current: isLive },
  ];
}

/** Turns an event's status into an activity feed entry */
function activityFor(event) {
  switch (event.status) {
    case "live": return { title: "Event Started", sub: `${event.name} is now LIVE`, color: "var(--red)" };
    case "confirmed":
    case "approved": return { title: "Event Approved", sub: `${event.name} was approved`, color: "var(--green)" };
    case "completed": return { title: "Event Concluded", sub: `${event.name} finished`, color: "var(--text-muted)" };
    case "rejected": return { title: "Event Rejected", sub: `${event.name} was declined`, color: "var(--red)" };
    default: return { title: "New Request", sub: `${event.name} submitted`, color: "var(--blue)" };
  }
}

export function useClientDashboardData() {
  // --------------------------------------------------------------------------
  // 1. STATE DEFINITIONS
  // --------------------------------------------------------------------------
  const [events, setEvents] = useState([]);
  const [allocations, setAllocations] = useState({});
  const [assignments, setAssignments] = useState([]);
  const [monitor, setMonitor] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --------------------------------------------------------------------------
  // 2. DATA FETCH + AUTO REFRESH EFFECT
  // FACULTY MAY ASK: Why return clearInterval?
  // HOW TO CHANGE: React runs it when you leave the page, so the timer stops
  // instead of fetching forever in the background.
  // --------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        // Promise.all runs the 4 requests in parallel instead of one after another
        const [myEvents, allocs, staffAssignments, monitorProgress] = await Promise.all([
          getMyEvents(),
          getResourceAllocations(),
          getStaffAssignments(),
          getMonitorProgress(),
        ]);
        if (!isMounted) return;
        setEvents(myEvents);
        setAllocations(allocs || {});
        setAssignments(staffAssignments || []);
        setMonitor(monitorProgress || {});
        setError(null);
      } catch (err) {
        if (isMounted) setError(describeError(err, "your dashboard"));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    const timer = setInterval(loadData, REFRESH_MS);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  // --------------------------------------------------------------------------
  // 3. KPI METRICS
  // --------------------------------------------------------------------------
  const stats = useMemo(() => ({
    active: events.filter((e) => ["confirmed", "approved", "live"].includes(e.status)).length,
    live: events.filter((e) => e.status === "live").length,
    pending: events.filter((e) => e.status === "pending").length,
    total: events.length,
    completed: events.filter((e) => e.status === "completed").length,
  }), [events]);

  // --------------------------------------------------------------------------
  // 4. NEXT EVENT + TIMELINE
  // --------------------------------------------------------------------------
  const nextEvent = pickNextEvent(events);
  const progress = nextEvent ? getEventProgress(nextEvent, allocations, assignments) : null;
  const steps = nextEvent ? buildSteps(nextEvent, progress, monitor) : [];

  // --------------------------------------------------------------------------
  // 5. ACTIVITY FEED (latest 4 events, newest first)
  // --------------------------------------------------------------------------
  const activities = [...events].reverse().slice(0, 4).map((event) => ({
    id: event.id,
    date: event.date,
    ...activityFor(event),
  }));

  return { loading, error, stats, nextEvent, progress, steps, activities };
}

export default useClientDashboardData;
