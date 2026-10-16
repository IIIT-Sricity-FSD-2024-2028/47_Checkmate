/**
 * ============================================================================
 * EVENT REVIEW ACTION BAR COMPONENT (EventReviewActionBar.jsx)
 * ============================================================================
 * Role: Reusable Component (Vendor Portal)
 * Location: src/components/vendor/EventReviewActionBar.jsx
 *
 * Purpose:
 *   Renders the bottom action bar containing the primary decision triggers:
 *     1. Back button (navigates back to the event requests list).
 *     2. Reject Event button (updates status to 'rejected').
 *     3. Accept Event button (updates status to 'confirmed').
 *   Both action buttons automatically disable if the event is already in
 *   that status to prevent duplicate submissions.
 *
 * Props:
 *   @param {string} props.eventStatus - Current status of the event ('pending', 'confirmed', etc.)
 *   @param {Function} props.onBack - Handler to return to the requests table
 *   @param {Function} props.onReject - Handler to execute event rejection
 *   @param {Function} props.onAccept - Handler to execute event acceptance
 * ============================================================================
 */

import React from "react";
import { ArrowLeft, Check, X } from "lucide-react";

function EventReviewActionBar({ eventStatus, onBack, onReject, onAccept }) {
  const isConfirmed = eventStatus === "confirmed";
  const isRejected = eventStatus === "rejected";

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

      {/* ── Action 2: Reject Event ── */}
      <button
        type="button"
        className="btn-reject"
        onClick={onReject}
        disabled={isRejected}
        title={isRejected ? "Event is already rejected" : "Reject this event request"}
      >
        <X size={16} /> Reject Event
      </button>

      {/* ── Action 3: Accept / Confirm Event ── */}
      <button
        type="button"
        className="btn-approve"
        onClick={onAccept}
        disabled={isConfirmed}
        title={isConfirmed ? "Event is already confirmed" : "Accept and confirm this event"}
      >
        <Check size={16} /> Accept Event
      </button>
    </div>
  );
}

export default EventReviewActionBar;
