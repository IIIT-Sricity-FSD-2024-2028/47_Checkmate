/**
 * ============================================================================
 * TRACK HERO CARD (TrackHeroCard.jsx)
 * ============================================================================
 * Role: Reusable Component (Client Track Progress page)
 * Location: src/components/client/TrackHeroCard.jsx
 *
 * Purpose:
 *   Top card of Track Progress: event name, date, venue, guest count,
 *   a status badge and the overall progress bar.
 *   Badge rules (same as the old page):
 *     Rejected > Completed > LIVE NOW > Ready (5/5 steps) > In Progress (approved) > Pending Review
 *
 * Props:
 *   @param {Object} event - The event being tracked
 *   @param {Object} progress - Result of getEventProgress()
 * ============================================================================
 */

import React from "react";
import { Calendar, MapPin, Users } from "lucide-react";
import { formatDate } from "../../utils/clientHelpers";

function getBadge(event, progress) {
  if (event.status === "rejected") return { cls: "red", text: "Rejected" };
  if (event.status === "completed") return { cls: "green", text: "Completed ✅" };
  if (event.status === "live") return { cls: "live", text: "LIVE NOW" };
  if (progress.stepsComplete === 5) return { cls: "green", text: "Ready" };
  if (progress.isApproved) return { cls: "purple", text: "In Progress" };
  return { cls: "blue", text: "Pending Review" };
}

function TrackHeroCard({ event, progress }) {
  const badge = getBadge(event, progress);

  return (
    <div className="card cl-tp-hero">
      <div className="cl-tp-hero__top">
        <div>
          <h3>{event.name}</h3>
          <div className="cl-tp-hero__meta">
            <span><Calendar size={14} /> {formatDate(event.date, "long")}</span>
            <span><MapPin size={14} /> {event.venue || "TBD"}</span>
            <span><Users size={14} /> {event.people || event.guests || "—"}</span>
          </div>
        </div>
        <div className={`cl-tag cl-tag--${badge.cls} cl-tag--lg`}>
          {event.status === "live" && <span className="live-dot" />} {badge.text}
        </div>
      </div>

      <div className="cl-progress-label">
        <span>Overall Progress</span>
        <span className="cl-progress-pct">{progress.percent}%</span>
      </div>
      <div className="cl-progress-track">
        <div className="cl-progress-fill" style={{ width: `${progress.percent}%` }} />
      </div>
    </div>
  );
}

export default TrackHeroCard;
