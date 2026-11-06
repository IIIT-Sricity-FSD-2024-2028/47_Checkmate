/**
 * ============================================================================
 * CLIENT NEXT EVENT SECTION COMPONENT (ClientNextEventSection.jsx)
 * ============================================================================
 * Role: Reusable Component (Client Portal)
 * Location: src/components/client/ClientNextEventSection.jsx
 *
 * Purpose:
 *   Renders the "Next Event Progress" card on the Client Dashboard:
 *     - Event name, venue and date with an overall progress bar.
 *     - The 5-step timeline (Submitted → Approval → Resources → Staffing → Execution).
 *     - "Full Tracking →" link to the Track Progress page.
 *     - An empty state with a "Create Event" button when there are no events.
 *
 * Props:
 *   @param {Object|null} props.event - The highlighted event (or null)
 *   @param {Object|null} props.progress - Result of getEventProgress()
 *   @param {Array} props.steps - [{ title, desc, done, current }]
 *   @param {boolean} props.loading - Data loading flag
 * ============================================================================
 */

import React from "react";
import { Link } from "react-router-dom";
import { Calendar, Check, Loader2, MapPin, PartyPopper, PlusCircle } from "lucide-react";
import { formatDate } from "../../utils/clientHelpers";

function ClientNextEventSection({ event, progress, steps = [], loading = false }) {
  return (
    <div className="card">
      {/* ── Card Header ── */}
      <div className="card__header">
        <h3>Next Event Progress</h3>
        <Link to={event ? `/client/track/${event.id}` : "/client/events"} className="view-all">
          Full Tracking →
        </Link>
      </div>

      {/* ── Empty / loading state ── */}
      {!event && (
        <div className="cl-client-empty">
          {loading ? (
            <p>Loading your events...</p>
          ) : (
            <>
              <Calendar size={42} />
              <p>No events yet. Create your first event!</p>
              <Link to="/client/create-event" className="cl-btn-pink">
                <PlusCircle size={16} /> Create Event
              </Link>
            </>
          )}
        </div>
      )}

      {event && (
        <>
          {/* ── Event summary + progress bar ── */}
          <div className="cl-next-event">
            <h4><PartyPopper size={16} color="var(--pink)" /> {event.name}</h4>
            <p>
              <MapPin size={13} /> {event.venue || "TBA"} • <Calendar size={13} /> {formatDate(event.date)}
            </p>
            <div className="cl-progress-label">
              <span>Overall Progress</span>
              <span className="cl-progress-pct">{progress.percent}%</span>
            </div>
            <div className="cl-progress-track">
              <div className="cl-progress-fill" style={{ width: `${progress.percent}%` }} />
            </div>
          </div>

          {/* ── 5-step timeline ── */}
          <div className="cl-timeline">
            {steps.map((step, index) => {
              const state = step.current ? "in-progress" : step.done ? "completed" : "upcoming";
              const isLast = index === steps.length - 1;
              return (
                <div className={`cl-tl-item ${state}`} key={step.title}>
                  <div className="cl-tl-icon-col">
                    <div className="cl-tl-icon">
                      {step.current ? <Loader2 size={14} className="cl-spin" /> : step.done ? <Check size={14} /> : null}
                    </div>
                    {!isLast && <div className={`cl-tl-line ${step.done ? "active" : ""}`} />}
                  </div>
                  <div>
                    <div className="cl-tl-title">{step.title}</div>
                    <div className="cl-tl-desc">{step.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default ClientNextEventSection;
