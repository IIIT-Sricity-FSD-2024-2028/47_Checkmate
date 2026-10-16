/**
 * ============================================================================
 * TRACK PROGRESS TIMELINE (TrackTimeline.jsx)
 * ============================================================================
 * Role: Reusable Component (Client Track Progress page)
 * Location: src/components/client/TrackTimeline.jsx
 *
 * Purpose:
 *   The 5-step "Progress Timeline" card:
 *     1. Request Submitted  – submission date
 *     2. Request Approved   – approved / awaiting / rejected (+ reason & conflicts)
 *     3. Resources Allocated – list of allocated resources with quantities
 *     4. Staff Assigned      – list of staff who accepted, with their roles
 *     5. Event Execution     – live start time / completed end time / estimate
 *   Each step is "completed", "in-progress" or "upcoming", which sets its colour.
 *
 * Props:
 *   @param {Object} event - The event being tracked
 *   @param {Object} progress - Result of getEventProgress()
 * ============================================================================
 */

import React from "react";
import { Check, CheckCircle2, Clock, Package, Radio, X, XCircle } from "lucide-react";
import { formatClock, formatDate, initials } from "../../utils/clientHelpers";

// Coloured tag shown under a step
function Tag({ color, icon, children }) {
  return <div className={`cl-tag cl-tag--${color}`}>{icon}{children}</div>;
}

// One timeline step. state = "completed" | "in-progress" | "upcoming"
function Step({ number, state, icon, title, desc, isLast, children }) {
  let circle = number;
  if (icon) circle = icon;
  else if (state === "completed") circle = <Check size={14} />;
  else if (state === "in-progress") circle = <Clock size={14} />;

  return (
    <div className={`cl-tl-item ${state}`}>
      <div className="cl-tl-icon-col">
        <div className="cl-tl-icon">{circle}</div>
        {!isLast && <div className={`cl-tl-line ${state === "completed" ? "active" : ""}`} />}
      </div>
      <div className="cl-tl-body">
        <div className="cl-tl-title">{title}</div>
        <div className="cl-tl-desc">{desc}</div>
        {children}
      </div>
    </div>
  );
}

function TrackTimeline({ event, progress }) {
  const { isApproved, hasResources, hasStaff, eventAllocations, assignedStaff } = progress;
  const isRejected = event.status === "rejected";
  const isLive = event.status === "live";
  const isCompleted = event.status === "completed";

  // Work out the state of each step
  const approvalState = isApproved ? "completed" : isRejected ? "upcoming" : "in-progress";
  const resourceState = isApproved && hasResources ? "completed" : isApproved ? "in-progress" : "upcoming";
  const staffState = isApproved && hasStaff ? "completed" : isApproved ? "in-progress" : "upcoming";
  const liveState = isCompleted ? "completed" : isLive || (isApproved && hasStaff) ? "in-progress" : "upcoming";

  const startedAt = formatClock(event.startedAt);
  const endedAt = formatClock(event.endedAt);

  return (
    <div className="card">
      <div className="cl-card-title"><Clock size={18} /> Progress Timeline</div>
      <div className="cl-timeline">
        {/* Step 1: Submitted */}
        <Step number={1} state="completed" title="Request Submitted"
          desc="Your event request has been received and is under review">
          <Tag color="green">{event.submittedAt ? `Submitted on ${formatDate(event.submittedAt)}` : "Submitted previously"}</Tag>
        </Step>

        {/* Step 2: Approval */}
        <Step number={2} state={approvalState} title="Request Approved"
          desc="Vendor coordinator review and approval"
          icon={isRejected ? <X size={14} color="var(--red)" /> : null}>
          {isApproved && <Tag color="green" icon={<CheckCircle2 size={13} />}>Request approved by coordinator</Tag>}
          {!isApproved && !isRejected && <Tag color="blue" icon={<Clock size={13} />}>Awaiting vendor approval</Tag>}
          {isRejected && (
            <>
              <Tag color="red" icon={<XCircle size={13} />}>Rejected due to conflict</Tag>
              <div className="cl-reason-box">{event.rejectionReason || "Rejected by vendor"}</div>
              {(event.conflicts || []).map((c, i) => (
                <div className="cl-conflict cl-conflict--sm" key={i}>
                  <span className="cl-conflict__type">{c.type}</span>
                  <span className="cl-conflict__desc">{c.desc}</span>
                </div>
              ))}
            </>
          )}
        </Step>

        {/* Step 3: Resources */}
        <Step number={3} state={resourceState} title="Resources Allocated"
          desc="Equipment, catering, and venue arrangements">
          {resourceState === "completed" && (
            <>
              <Tag color="green" icon={<CheckCircle2 size={13} />}>{eventAllocations.length} resource(s) allocated</Tag>
              <div className="cl-tp-list">
                {eventAllocations.map((a) => {
                  const qty = a.quantity ?? a.qty ?? 0;
                  return (
                    <div className="cl-tp-list__item cl-tp-list__item--green" key={a.resourceId}>
                      <Package size={14} />
                      <span>{a.resourceName}</span>
                      <span className="cl-tp-list__meta">{qty} unit{qty !== 1 ? "s" : ""}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
          {resourceState === "in-progress" && <Tag color="blue" icon={<Clock size={13} />}>Vendor is allocating resources</Tag>}
          {resourceState === "upcoming" && <Tag color="blue">Vendor allocating...</Tag>}
        </Step>

        {/* Step 4: Staff */}
        <Step number={4} state={staffState} title="Staff Assigned"
          desc="Event team and coordinator assignment">
          {staffState === "completed" && (
            <>
              <Tag color="green" icon={<CheckCircle2 size={13} />}>{assignedStaff.length} staff member(s) assigned</Tag>
              <div className="cl-tp-list">
                {assignedStaff.map((s) => (
                  <div className="cl-tp-list__item cl-tp-list__item--purple" key={s.id}>
                    <div className="cl-avatar cl-avatar--sm">{initials(s.staffName)}</div>
                    <span>{s.staffName}</span>
                    <span className="cl-tp-list__meta">{s.role || s.staffRole}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {staffState === "in-progress" && <Tag color="blue" icon={<Clock size={13} />}>Coordinator assigning staff</Tag>}
          {staffState === "upcoming" && <Tag color="blue">Assigning team...</Tag>}
        </Step>

        {/* Step 5: Execution */}
        <Step number={5} state={liveState} title="Event Execution" isLast
          desc="Event is live and being monitored"
          icon={isLive ? <Radio size={14} color="#fca5a5" /> : null}>
          {isLive && (
            <div className="cl-tag cl-tag--live">
              <span className="live-dot" /> {startedAt ? `Event started at ${startedAt}` : "Event is now live"}
            </div>
          )}
          {isCompleted && (
            <Tag color="green" icon={<CheckCircle2 size={13} />}>
              {endedAt ? `Event concluded at ${endedAt}` : "Event completed successfully"}
            </Tag>
          )}
          {!isLive && !isCompleted && isApproved && hasStaff && (
            <Tag color="blue" icon={<Clock size={13} />}>Awaiting vendor to start event</Tag>
          )}
          {!isLive && !isCompleted && !(isApproved && hasStaff) && (
            <Tag color="blue">Estimated: {formatDate(event.date, "long")}</Tag>
          )}
        </Step>
      </div>
    </div>
  );
}

export default TrackTimeline;
