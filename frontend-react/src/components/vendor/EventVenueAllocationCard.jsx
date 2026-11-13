/**
 * ============================================================================
 * EVENT VENUE ALLOCATION CARD (EventVenueAllocationCard.jsx)
 * ============================================================================
 * Role: Reusable Component (Vendor Portal)
 * Location: src/components/vendor/EventVenueAllocationCard.jsx
 *
 * Purpose:
 *   Shows the venue for the event under review and lets the vendor settle it:
 *     - Client's venue matches a listed venue: "▶ Confirm"
 *     - Client typed an unlisted venue: "Keep Client's Venue"
 *     - No venue requested (TBD): choose one from the list
 *   "Choose Venue" / "Change Venue" opens the picker in every case.
 *   "Remove" undoes an allocation until the event is approved.
 * ============================================================================
 */

import React from "react";
import { MapPin } from "lucide-react";
import { formatCurrency } from "../../utils/formatCurrency";

function EventVenueAllocationCard({
  venueName,
  isUnset = false,
  venue = null,
  guests = 0,
  isAllocated = false,
  isLocked = false,
  onConfirm,
  onKeepClientVenue,
  onRemove,
  onOpenPicker,
}) {
  const hasIssues = !isLocked && Boolean(venue?.issues?.length);
  const statusClass = hasIssues ? "critical" : isAllocated || isLocked ? "safe" : "risk";
  const statusLabel = hasIssues
    ? "Conflict"
    : isAllocated
    ? "Allocated"
    : isLocked
    ? "Closed"
    : "Pending";

  return (
    <div className="client-req-card er-card-section" id="venueAllocationSection">
      <div className="er-section-header">
        <h3 className="section-title">
          <MapPin size={16} className="er-title-icon er-title-icon--pink" />
          Venue Allocation
        </h3>

        {!isLocked && (
          <button
            type="button"
            className="btn-alloc-extra-res"
            onClick={onOpenPicker}
            title="Choose a venue for this event"
          >
            <MapPin size={14} /> {isUnset ? "Choose Venue" : "Change Venue"}
          </button>
        )}
      </div>

      <div className="req-wrap">
        <table className="req-table">
          <thead>
            <tr>
              <th>Venue</th>
              <th>Location</th>
              <th className="text-center">Capacity</th>
              <th className="text-center">Guests</th>
              <th className="text-right">Price / Day</th>
              <th className="text-right">Status</th>
              <th className="text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{isUnset ? "No venue requested" : venueName}</td>
              <td>{venue?.location || (isUnset ? "—" : "Client's own venue")}</td>
              <td className="col-num">{venue?.capacity ?? "—"}</td>
              <td className="col-num">{guests || "—"}</td>
              <td className="text-right">
                {venue ? formatCurrency(venue.pricePerDay) : "—"}
              </td>
              <td className="text-right">
                <span className={`row-status ${statusClass}`}>{statusLabel}</span>
              </td>
              <td className="text-center">
                {isAllocated && !isLocked ? (
                  <>
                    <span className={`row-status ${hasIssues ? "critical" : "safe"}`}>
                      {hasIssues ? "⚠ Conflict" : "✓ Allocated"}
                    </span>{" "}
                    <button
                      type="button"
                      className="er-btn-action-assign"
                      onClick={onRemove}
                      title="Remove this venue allocation"
                    >
                      Remove
                    </button>
                  </>
                ) : hasIssues ? (
                  <span className="row-status critical">⚠ Conflict</span>
                ) : isAllocated ? (
                  <span className="row-status safe">✓ Allocated</span>
                ) : isLocked ? (
                  "—"
                ) : venue ? (
                  <button
                    type="button"
                    className="er-btn-action-allocate"
                    onClick={onConfirm}
                    title={`Confirm ${venue.name} for this event`}
                  >
                    ▶ Confirm
                  </button>
                ) : !isUnset ? (
                  <button
                    type="button"
                    className="er-btn-action-allocate"
                    onClick={onKeepClientVenue}
                    title="Accept the venue the client arranged themselves"
                  >
                    Keep Client's Venue
                  </button>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default React.memo(EventVenueAllocationCard);
