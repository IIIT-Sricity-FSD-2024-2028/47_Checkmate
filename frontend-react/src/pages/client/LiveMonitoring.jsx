/**
 * ============================================================================
 * MODULAR CLIENT LIVE MONITORING PAGE (LiveMonitoring.jsx) — /client/live/:id
 * ============================================================================
 * Role: Client
 * Purpose:
 *   Real-time view of a live event (port of client_livemonitoring.html),
 *   reached from Track Progress → "Live Monitoring":
 *     1. Connects to `useClientLiveData` (refreshes every 3 seconds).
 *     2. Assembles focused, reusable modular subcomponents:
 *         - <ClientTopbar>: Title + LIVE badge, back arrow.
 *         - <LiveTaskProgressCard>: Staff task completion timeline.
 *         - <LivePhasesCard>: Setup / registration / event / breakdown bars.
 *         - <LiveResourcesCard>: Resources in use.
 *         - <LiveStaffSection>: Staff working the event.
 *         - <LiveQuickActions>: Support, messages, back.
 *
 * Connected Backend Endpoints:
 *   - GET /events/:id, /staff-assignments, /state/resourceAllocations, /state/monitorProgress
 * ============================================================================
 */

import React from "react";
import { useParams } from "react-router-dom";

// Stylesheets
import "../../styles/dashboard.css";
import "./client.css";

// Shared components
import ClientTopbar from "../../components/client/ClientTopbar";

// Custom Data Hook
import useClientLiveData from "../../components/client/useClientLiveData";

// Modular Live Monitoring Subcomponents
import LiveTaskProgressCard from "../../components/client/LiveTaskProgressCard";
import {
  LivePhasesCard,
  LiveResourcesCard,
  LiveStaffSection,
  LiveQuickActions,
} from "../../components/client/LiveStatusCards";

function LiveMonitoring() {
  const { id } = useParams();
  const { event, error, staff, tasks, doneCount, taskPercent, resources, phases } = useClientLiveData(id);

  return (
    <div className="dashboard-page">
      <ClientTopbar
        title={<>Live Event Monitoring <span className="cl-tag cl-tag--live"><span className="live-dot" /> LIVE</span></>}
        subtitle={event ? `${event.name} • ${event.type || "Event"} • ${event.venue || "TBD"}` : "Loading…"}
        backTo="/client/events"
      />

      <div className="content">
        {error && <div className="cl-client-error">{error}</div>}
        {event && event.status !== "live" && (
          <div className="cl-client-error">This event is not live right now (status: {event.status}).</div>
        )}

        <div className="cl-live-grid">
          {/* ── Left: task progress ── */}
          <LiveTaskProgressCard tasks={tasks} doneCount={doneCount} taskPercent={taskPercent} />

          {/* ── Right: phases + resources ── */}
          <div className="cl-tp-side">
            <LivePhasesCard phases={phases} />
            <LiveResourcesCard resources={resources} />
          </div>
        </div>

        <LiveStaffSection staff={staff} />
        <LiveQuickActions />
      </div>
    </div>
  );
}

export default LiveMonitoring;
