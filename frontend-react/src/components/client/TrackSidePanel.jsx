/**
 * ============================================================================
 * TRACK SIDE PANEL (TrackSidePanel.jsx)
 * ============================================================================
 * Role: Reusable Component (Client Track Progress page)
 * Location: src/components/client/TrackSidePanel.jsx
 *
 * Purpose:
 *   Right-hand column of Track Progress:
 *     1. "Service Status" card – approval / resources / staff, each green
 *        with a tick when done or grey with a clock while pending.
 *     2. "Quick Actions" card – Live Monitoring (only while live),
 *        Contact Coordinator (Messages) and Back to Events.
 *
 * Props:
 *   @param {Object} event - The event being tracked
 *   @param {Object} progress - Result of getEventProgress()
 * ============================================================================
 */

import React from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowLeft, CheckCircle2, Clock, MessageCircle } from "lucide-react";

// One row of the Service Status card
function StatusRow({ done, doneText, pendingText }) {
  return (
    <div className={`cl-status-row ${done ? "done" : ""}`}>
      {done ? <CheckCircle2 size={20} /> : <Clock size={20} />}
      <span>{done ? doneText : pendingText}</span>
    </div>
  );
}

function TrackSidePanel({ event, progress }) {
  const { isApproved, hasResources, hasStaff, eventAllocations, assignedStaff } = progress;
  const isLive = event.status === "live";
  const isCompleted = event.status === "completed";
  const isRejected = event.status === "rejected";

  return (
    <div className="cl-tp-side">
      {/* ── Card 1: Service Status ── */}
      <div className="card">
        <div className="cl-card-title"><CheckCircle2 size={18} /> Service Status</div>
        <StatusRow done={isApproved}
          doneText={isLive ? "Approved — Event is LIVE" : isCompleted ? "Approved — Event completed" : "Approved by vendor coordinator"}
          pendingText={isRejected ? "Rejected due to resource/staff conflict" : "Pending vendor approval"} />
        <StatusRow done={hasResources}
          doneText={`${eventAllocations.length} resource(s) confirmed`}
          pendingText={isApproved ? "Vendor allocating resources" : "Awaiting event approval first"} />
        <StatusRow done={hasStaff}
          doneText={`${assignedStaff.length} staff assigned`}
          pendingText={isApproved ? "Vendor assigning team" : "Awaiting event approval first"} />
      </div>

      {/* ── Card 2: Quick Actions ── */}
      <div className="card">
        <div className="cl-card-title">Quick Actions</div>
        <div className="cl-action-stack">
          {isLive && (
            <Link to={`/client/live/${event.id}`} className="cl-btn-pink cl-btn-block">
              <Activity size={16} /> Live Monitoring
            </Link>
          )}
          <Link to="/client/messages" className={`${isLive ? "cl-btn-ghost" : "cl-btn-pink"} cl-btn-block`}>
            <MessageCircle size={16} /> Contact Coordinator
          </Link>
          <Link to="/client/events" className="cl-btn-ghost cl-btn-block">
            <ArrowLeft size={16} /> Back to Events
          </Link>
        </div>
      </div>
    </div>
  );
}

export default TrackSidePanel;
