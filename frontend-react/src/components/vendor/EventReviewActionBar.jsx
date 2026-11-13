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
import { ArrowLeft, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";

function EventReviewActionBar({
  eventStatus,
  hasConflicts = false,
  hasAllocatedResources = true,
  hasAllocatedStaff = true,
  hasAllocatedVenue = true,
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

  const isFullyAllocated = hasAllocatedResources && hasAllocatedStaff && hasAllocatedVenue;
  const canApprove = !isAlreadyProcessed && !hasConflicts && isFullyAllocated;
  const missingAllocations = [
    !hasAllocatedResources && "Resource",
    !hasAllocatedStaff && "Staff",
    !hasAllocatedVenue && "Venue",
  ].filter(Boolean);

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

      {/* ── State A: Disallow Approval Notice if missing resources or staff ── */}
      {!isAlreadyProcessed && !hasConflicts && !isFullyAllocated && (
        <div
          className="allocation-required-badge"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            padding: "8px 14px",
            borderRadius: "8px",
            background: "rgba(234, 179, 8, 0.12)",
            border: "1px solid rgba(234, 179, 8, 0.35)",
            color: "#fde047",
            fontSize: "12.5px",
            fontWeight: 500,
          }}
          title="Events require at least one allocated resource, one assigned staff member and a confirmed venue before approval"
        >
          <AlertCircle size={15} color="#eab308" />
          <span>
            {[missingAllocations.slice(0, -1).join(", "), missingAllocations.at(-1)]
              .filter(Boolean)
              .join(" & ")}{" "}
            allocation required before approval
          </span>
        </div>
      )}

      {/* ── Action 2: Approve Event (Only rendered when conflicts resolved AND both resources & staff allocated) ── */}
      {canApprove && (
        <button
          type="button"
          className="btn-approve"
          onClick={onApprove}
          title="Approve and confirm this event request"
        >
          <CheckCircle size={17} /> Approve Event
        </button>
      )}

      {/* ── Action 3: Keep Waiting (When conflicts remain) ── */}
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

      {/* ── Action 4: Reject Event ── */}
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
