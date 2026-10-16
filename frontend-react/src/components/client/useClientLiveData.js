/**
 * ============================================================================
 * CLIENT LIVE MONITORING DATA HOOK (useClientLiveData.js)
 * ============================================================================
 * Role: Custom Data Retrieval Hook (Client Live Monitoring page)
 * Location: src/components/client/useClientLiveData.js
 *
 * Purpose:
 *   Real-time data for one live event, refreshed every 3 seconds like the old page:
 *     1. The event, accepted staff assignments, resource allocations and phase %.
 *     2. Every task from every staff member on the event (staff create these on
 *        their Task Board; they are stored inside each assignment's `tasks` array),
 *        sorted with finished tasks first, plus the overall completion %.
 *
 * Connected Backend Endpoints:
 *   - GET /api/events/:id                -> event name / type / venue / status
 *   - GET /api/staff-assignments         -> accepted staff and their tasks
 *   - GET /api/state/resourceAllocations -> resources allocated to the event
 *   - GET /api/state/monitorProgress     -> setup / registration / event / breakdown %
 *
 * Returns:
 *   @returns {Object} { event, error, staff, tasks, doneCount, taskPercent, resources, phases }
 * ============================================================================
 */

import { useEffect, useState } from "react";
import { getEventById } from "../../services/eventService";
import { getStaffAssignments } from "../../services/staffService";
import { getResourceAllocations, getMonitorProgress } from "../../services/stateService";
import { describeError } from "../../utils/clientHelpers";

const LIVE_REFRESH_MS = 3000;

export function useClientLiveData(eventId) {
  const [event, setEvent] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [allocations, setAllocations] = useState({});
  const [monitor, setMonitor] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [ev, staffAssignments, allocs, monitorProgress] = await Promise.all([
          getEventById(eventId),
          getStaffAssignments(),
          getResourceAllocations(),
          getMonitorProgress(),
        ]);
        if (!isMounted) return;
        setEvent(ev);
        setAssignments(staffAssignments || []);
        setAllocations(allocs || {});
        setMonitor(monitorProgress || {});
        setError(null);
      } catch (err) {
        if (isMounted) setError(describeError(err, "this event"));
      }
    }

    loadData();
    const timer = setInterval(loadData, LIVE_REFRESH_MS);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [eventId]);

  // Staff who accepted this event
  const staff = assignments.filter((a) => a.eventId === eventId && a.status === "accepted");

  // Every task, tagged with the staff member who owns it
  // FACULTY MAY ASK: Why flatMap?
  // HOW TO CHANGE: Each assignment has its own tasks array; flatMap joins all of
  // them into one list (map would give an array of arrays).
  const allTasks = staff.flatMap((a) => (a.tasks || []).map((t) => ({ ...t, staffName: a.staffName })));
  const doneCount = allTasks.filter((t) => t.status === "done").length;
  const taskPercent = allTasks.length > 0 ? Math.round((doneCount / allTasks.length) * 100) : 0;

  // Finished tasks first, like the old page
  const tasks = [...allTasks].sort((a, b) => (a.status === "done" ? 0 : 1) - (b.status === "done" ? 0 : 1));

  return {
    event,
    error,
    staff,
    tasks,
    doneCount,
    taskPercent,
    resources: allocations[eventId] || [],
    phases: monitor[eventId] || {},
  };
}

export default useClientLiveData;
