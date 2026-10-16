/**
 * ============================================================================
 * CLIENT TRACK PROGRESS DATA HOOK (useClientTrackData.js)
 * ============================================================================
 * Role: Custom Data Retrieval Hook (Client Track Progress page)
 * Location: src/components/client/useClientTrackData.js
 *
 * Purpose:
 *   Loads one event plus everything needed to show how far it has got:
 *     1. The event itself (by id from the URL).
 *     2. Resource allocations and staff assignments, turned into progress
 *        with the shared getEventProgress() helper (same maths as the dashboard).
 *     3. Re-fetches every REFRESH_MS. The old page reloaded the whole browser
 *        tab every 5 s; here only the data is re-fetched, so nothing flickers.
 *
 * Connected Backend Endpoints:
 *   - GET /api/events/:id                -> the event
 *   - GET /api/state/resourceAllocations -> resources allocated to it
 *   - GET /api/staff-assignments         -> staff who accepted it
 *
 * Returns:
 *   @returns {Object} { event, progress, loading, notFound }
 * ============================================================================
 */

import { useEffect, useState } from "react";
import { getEventById } from "../../services/eventService";
import { getStaffAssignments } from "../../services/staffService";
import { getResourceAllocations } from "../../services/stateService";
import { getEventProgress, REFRESH_MS } from "../../utils/clientHelpers";

export function useClientTrackData(eventId) {
  const [event, setEvent] = useState(null);
  const [allocations, setAllocations] = useState({});
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [ev, allocs, staffAssignments] = await Promise.all([
          getEventById(eventId),
          getResourceAllocations(),
          getStaffAssignments(),
        ]);
        if (!isMounted) return;
        setEvent(ev);
        setAllocations(allocs || {});
        setAssignments(staffAssignments || []);
        setNotFound(!ev);
      } catch {
        // 404 (wrong id) or backend down -> show the "Event Not Found" card
        if (isMounted) setNotFound(true);
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
  }, [eventId]);

  const progress = event ? getEventProgress(event, allocations, assignments) : null;

  return { event, progress, loading, notFound };
}

export default useClientTrackData;
