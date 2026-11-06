/**
 * ============================================================================
 * MODULAR CLIENT TRACK PROGRESS PAGE (TrackProgress.jsx) — /client/track/:id
 * ============================================================================
 * Role: Client
 * Purpose:
 *   Detailed progress of one event (port of client_trackprogress.html):
 *     1. Reads the event id from the URL with useParams().
 *     2. Connects to `useClientTrackData` for loading + auto refresh.
 *     3. Assembles focused, reusable modular subcomponents:
 *         - <ClientTopbar>: Title with a back arrow to My Events.
 *         - <TrackHeroCard>: Name, date, venue, guests, status badge, progress bar.
 *         - <TrackTimeline>: 5 steps with allocated resources & assigned staff.
 *         - <TrackSidePanel>: Service status + quick actions.
 *     4. Shows an "Event Not Found" card for a wrong / inaccessible id.
 *
 * Connected Backend Endpoints:
 *   - GET /events/:id, GET /state/resourceAllocations, GET /staff-assignments
 * ============================================================================
 */

import React from "react";
import { Link, useParams } from "react-router-dom";
import { AlertCircle } from "lucide-react";

// Stylesheets
import "../../styles/dashboard.css";
import "./client.css";

// Shared components
import ClientTopbar from "../../components/client/ClientTopbar";

// Custom Data Hook
import useClientTrackData from "../../components/client/useClientTrackData";

// Modular Track Progress Subcomponents
import TrackHeroCard from "../../components/client/TrackHeroCard";
import TrackTimeline from "../../components/client/TrackTimeline";
import TrackSidePanel from "../../components/client/TrackSidePanel";

function TrackProgress() {
  // :id from the URL, e.g. /client/track/EVT003 -> "EVT003"
  const { id } = useParams();
  const { event, progress, loading, notFound } = useClientTrackData(id);

  return (
    <div className="dashboard-page">
      <ClientTopbar title="Track Progress" subtitle="Monitor your event preparation status" backTo="/client/events" />

      <div className="content">
        {loading && <div className="cl-client-muted">Loading…</div>}

        {/* ── Wrong id / no access ── */}
        {!loading && (notFound || !event) && (
          <div className="card cl-client-empty">
            <AlertCircle size={64} color="var(--red)" />
            <h3>Event Not Found</h3>
            <p>The event request you are trying to track doesn't exist or you don't have access.</p>
            <Link to="/client/events" className="cl-btn-pink">Back to My Events</Link>
          </div>
        )}

        {!loading && event && !notFound && (
          <>
            {/* ── Component 1: Hero card with progress bar ── */}
            <TrackHeroCard event={event} progress={progress} />

            <div className="cl-tp-grid">
              {/* ── Component 2: 5-step timeline ── */}
              <TrackTimeline event={event} progress={progress} />

              {/* ── Component 3: Service status + quick actions ── */}
              <TrackSidePanel event={event} progress={progress} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default TrackProgress;
