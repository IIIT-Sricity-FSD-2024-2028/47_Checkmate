/**
 * ============================================================================
 * VENDOR UPCOMING EVENTS SECTION COMPONENT (VendorUpcomingEventsSection.jsx)
 * ============================================================================
 * Role: Reusable Component (Vendor Portal)
 * Location: src/components/vendor/VendorUpcomingEventsSection.jsx
 *
 * Purpose:
 *   Renders the Upcoming Events overview card on the Vendor Dashboard:
 *     - Displays chronologically sorted upcoming events (top 5).
 *     - Provides a direct "View All →" link to the complete events request table.
 *     - Renders an empty placeholder state if no events are scheduled.
 *
 * Reusable Components:
 *   - <UpcomingEventsCard>: Modular event preview row showing name, date/venue, and status pill.
 *
 * Props:
 *   @param {Array} props.events - Chronologically sorted upcoming event objects
 *   @param {boolean} props.loading - Data loading state flag
 * ============================================================================
 */

import React from "react";
import { Link } from "react-router-dom";
import UpcomingEventsCard from "./UpcomingEventsCard";
import { formatEventDate } from "./useVendorDashboardData";

function VendorUpcomingEventsSection({ events = [], loading = false }) {
  return (
    <div className="card event-card">
      {/* ── Card Header: Title & View All Navigation ── */}
      <div className="card__header">
        <h3>Upcoming Events</h3>
        <Link to="/vendor/events" className="view-all">
          View All →
        </Link>
      </div>

      {/* ── Events List or Empty State ── */}
      <div className="event-list">
        {events.length > 0 ? (
          events.map((ev) => (
            <UpcomingEventsCard
              key={ev.id || Math.random()}
              event_name={ev.name || "Untitled Event"}
              status={ev.status || "pending"}
              timeAndVenue={`${formatEventDate(ev.date)}${
                ev.venue ? " • " + ev.venue : ""
              }`}
            />
          ))
        ) : (
          <div className="card-empty-placeholder">
            {loading ? "Loading events..." : "No upcoming events found."}
          </div>
        )}
      </div>
    </div>
  );
}

export default VendorUpcomingEventsSection;
