/**
 * ============================================================================
 * EVENT REVIEW ACTION BAR COMPONENT (EventReviewActionBar.jsx)
 * ============================================================================
 * Role: Reusable Component (Vendor Portal)
 * Location: src/components/vendor/EventReviewActionBar.jsx
 *
 * Purpose:
 *   Bottom Action Bar with conditional workflow triggers:
 *     - Back to Requests button
 *     - If conflicts exist: "Keep Waiting" (reason to client) and "Reject Event"
 *     - If no conflicts: "Approve Event" and "Reject Event"
 * ============================================================================
 */

import React from "react";
import { ArrowLeft, CheckCircle, Clock, XCircle } from "lucide-react";

function EventReviewActionBar({
  eventStatus,
  hasConflicts = false,
  onBack,
  onApprove,
  onReject,
  onOpenKeepWaiting,
}) {
  const isAlreadyProcessed =
    eventStatus === "confirmed" ||
    eventStatus === "approved" ||
    eventStatus === "rejected" ||
    eventStatus === "completed";

  return (
    <div className="action-bar" role="toolbar" aria-label="Event Review Actions">
      {/* ── Action 1: Back to Requests List ── */}
      <button
        type="button"
        className="btn-back"
        onClick={onBack}
        title="Return to event requests list"
      >
        <ArrowLeft size={16} /> Back to Requests
      </button>

      {/* ── Action 2: Approve Event (When conflicts resolved) OR Keep Waiting (When conflicts remain) ── */}
      {!isAlreadyProcessed && !hasConflicts && (
        <button
          type="button"
          className="btn-approve"
          onClick={onApprove}
          title="Approve and confirm this event request"
        >
          <CheckCircle size={17} /> Approve Event
        </button>
      )}

      {!isAlreadyProcessed && hasConflicts && (
        <button
          type="button"
          className="btn-keep-waiting"
          onClick={onOpenKeepWaiting}
          title="Put event on wait and notify client with a reason"
        >
          <Clock size={16} /> Keep Waiting
        </button>
      )}

      {/* ── Action 3: Reject Event ── */}
      {!isAlreadyProcessed && (
        <button
          type="button"
          className="btn-reject"
          onClick={onReject}
          title="Reject this event request"
        >
          <XCircle size={17} /> Reject Event
        </button>
      )}
    </div>
  );
}

export default React.memo(EventReviewActionBar);
