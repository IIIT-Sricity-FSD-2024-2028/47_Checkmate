/**
 * ============================================================================
 * EVENT REVIEW HEADER COMPONENT (EventReviewHeader.jsx)
 * ============================================================================
 * Role: Reusable Component (Vendor Portal)
 * Location: src/components/vendor/EventReviewHeader.jsx
 *
 * Purpose:
 *   Renders the top title and navigation section of the Event Review page:
 *     - "Back to Requests" navigation button.
 *     - Event primary title and unique ID.
 *     - Metadata: Event Type, Venue, and Client Name.
 *     - Reusable StatusBadge showing the current lifecycle status.
 *
 * Props:
 *   @param {Object} props.event - The event object being reviewed
 *   @param {Function} props.onBack - Handler to return to the events list
 * ============================================================================
 */

import React from "react";
import { ArrowLeft, MapPin } from "lucide-react";
import StatusBadge from "./StatusBadge";

function EventReviewHeader({ event, onBack }) {
  if (!event) return null;

  return (
    <div className="ev-header">
      {/* ── Left Column: Back button, Title & Metadata ── */}
      <div className="ev-header__left">
        {/* Navigation back to main event requests list */}
        <button
          type="button"
          className="btn-back er-back-top"
          onClick={onBack}
        >
          <ArrowLeft size={14} /> Back to Requests
        </button>

        {/* Primary Event Name */}
        <h2>{event.name || "Untitled Event"}</h2>

        {/* Event Details Subtitle (ID, Type, Venue, Client) */}
        <p>
          <span>{event.id}</span> · <span>{event.type || "Event"}</span> ·{" "}
          <MapPin size={12} className="er-inline-icon" /> {event.venue || "Venue TBD"} ·{" "}
          <span>Client: {event.client || event.clientEmail || "Client"}</span>
        </p>
      </div>

      {/* ── Right Column: Reusable Status Badge (pending / confirmed / rejected) ── */}
      <div>
        <StatusBadge status={event.status} />
      </div>
    </div>
  );
}

export default EventReviewHeader;
