/**
 * ============================================================================
 * EVENT REVIEW META STATS COMPONENT (EventReviewStats.jsx)
 * ============================================================================
 * Role: Reusable Component (Vendor Portal)
 * Location: src/components/vendor/EventReviewStats.jsx
 *
 * Purpose:
 *   Replicates legacy Event Review 4-column Meta Overview grid:
 *     1. Date (Blue Calendar)
 *     2. Time (Purple Clock)
 *     3. Venue (Green MapPin)
 *     4. Expected Attendees (Orange Users)
 * ============================================================================
 */

import React from "react";
import { Calendar, Clock, MapPin, Users } from "lucide-react";

function formatDisplayDate(dateStr) {
  if (!dateStr) return "Date TBD";
  const dt = new Date(dateStr + (dateStr.includes("T") ? "" : "T00:00:00"));
  if (isNaN(dt.getTime())) return String(dateStr);
  return dt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function EventReviewStats({ event }) {
  if (!event) return null;

  return (
    <div className="ev-meta" aria-label="Event Key Meta Details">
      {/* ── Meta 1: Date ── */}
      <div className="ev-meta-item">
        <div className="ev-meta-icon ev-meta-icon--blue">
          <Calendar size={18} />
        </div>
        <div>
          <div className="ev-meta-label">Date</div>
          <div className="ev-meta-value">{formatDisplayDate(event.date)}</div>
        </div>
      </div>

      {/* ── Meta 2: Time ── */}
      <div className="ev-meta-item">
        <div className="ev-meta-icon ev-meta-icon--purple">
          <Clock size={18} />
        </div>
        <div>
          <div className="ev-meta-label">Time</div>
          <div className="ev-meta-value">{event.time || "9:00 AM – 6:00 PM"}</div>
        </div>
      </div>

      {/* ── Meta 3: Venue ── */}
      <div className="ev-meta-item">
        <div className="ev-meta-icon ev-meta-icon--green">
          <MapPin size={18} />
        </div>
        <div>
          <div className="ev-meta-label">Venue</div>
          <div className="ev-meta-value">{event.venue || "Convention Center"}</div>
        </div>
      </div>

      {/* ── Meta 4: Expected Attendees ── */}
      <div className="ev-meta-item">
        <div className="ev-meta-icon ev-meta-icon--orange">
          <Users size={18} />
        </div>
        <div>
          <div className="ev-meta-label">Expected Attendees</div>
          <div className="ev-meta-value">
            {event.people || event.guests || 500} people
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(EventReviewStats);
