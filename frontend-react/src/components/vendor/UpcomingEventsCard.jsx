/**
 * ============================================================================
 * VENDOR UPCOMING EVENT CARD ITEM COMPONENT (UpcomingEventsCard.jsx)
 * ============================================================================
 * Role: Atomic Presentation Component (Vendor Dashboard Portal)
 * Location: src/components/vendor/UpcomingEventsCard.jsx
 *
 * Parent / Invocation Context:
 *   - Called By: src/components/vendor/VendorUpcomingEventsSection.jsx (Lines 43–51)
 *   - Parent Page: Vendor Dashboard (src/pages/vendor/Dashboard.jsx, Component 3 in left-col)
 *   - Where in Code: Rendered inside the <div className="event-list"> iteration
 *     in VendorUpcomingEventsSection.jsx to display each upcoming scheduled event.
 *
 * Purpose:
 *   Renders an individual event card in the Vendor Upcoming Events overview:
 *     1. Displays the event title.
 *     2. Renders time and venue schedule information with a calendar icon.
 *     3. Renders a color-coded status badge with animated pulse dot for live events.
 *
 * Props:
 *   @param {string} props.event_name - Primary title of the event
 *   @param {string} props.status - Lifecycle status string ("Live", "Confirmed", "Pending")
 *   @param {string} props.timeAndVenue - Combined formatted schedule and location string
 * ============================================================================
 */

import React from "react";
import { Calendar } from "lucide-react";

function UpcomingEventsCard({ event_name, status, timeAndVenue }) {
  // --------------------------------------------------------------------------
  // 1. STATUS FORMATTING
  // --------------------------------------------------------------------------
  // Normalize status string for consistent CSS badge class targeting
  const statusLower = (status || "").toLowerCase().trim();

  // --------------------------------------------------------------------------
  // 2. RENDER COMPONENT
  // --------------------------------------------------------------------------
  return (
    <div className="event-item">
      {/* ── Event Details Block ── */}
      <div className="event-info">
        {/* Event Headline Name */}
        <div className="event-name">{event_name}</div>

        {/* Time and Venue Metadata Row */}
        <div className="event-meta">
          <Calendar size={13} className="meta-icon" />
          <span>{timeAndVenue}</span>
        </div>
      </div>

      {/* ── Status Pill Badge ── */}
      <span className={`status-badge ${statusLower}`}>
        {/* Pulsing indicator for active / ongoing events */}
        {statusLower === "live" && <span className="live-dot" />}
        {status}
      </span>
    </div>
  );
}

export default UpcomingEventsCard;