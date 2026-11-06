/**
 * ============================================================================
 * LIVE STATUS CARDS (LiveStatusCards.jsx)
 * ============================================================================
 * Role: Reusable Components (Client Live Monitoring page)
 * Location: src/components/client/LiveStatusCards.jsx
 *
 * Purpose:
 *   The smaller cards on the Live Monitoring page, kept together in one file
 *   because each is only a few lines:
 *     - <LivePhasesCard>:    setup / registration / event / breakdown % bars
 *     - <LiveResourcesCard>: resources allocated to the event
 *     - <LiveStaffSection>:  staff working the event, each marked Active
 *     - <LiveQuickActions>:  Request Support, Contact Coordinator, Back
 * ============================================================================
 */

import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Box, Circle, Gauge, Headphones, MessageCircle, Users, Zap } from "lucide-react";
import { initials } from "../../utils/clientHelpers";

const PHASES = ["setup", "registration", "event", "breakdown"];

/** @param {Object} phases - { setup, registration, event, breakdown } as 0–100 */
export function LivePhasesCard({ phases = {} }) {
  return (
    <div className="card">
      <div className="cl-card-title"><Gauge size={18} /> Event Phases</div>
      {PHASES.map((phase) => (
        <div className="cl-phase" key={phase}>
          <div className="cl-progress-label">
            <span className="cl-capitalize">{phase}</span>
            <span className="cl-progress-pct">{phases[phase] || 0}%</span>
          </div>
          <div className="cl-progress-track">
            <div className="cl-progress-fill" style={{ width: `${phases[phase] || 0}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** @param {Array} resources - [{ resourceId, resourceName, quantity }] */
export function LiveResourcesCard({ resources = [] }) {
  return (
    <div className="card">
      <div className="cl-card-title"><Box size={18} /> Resource Status</div>
      {resources.length === 0 && <div className="cl-client-muted">No specific resources tracked.</div>}
      {resources.map((r) => (
        <div className="cl-resource-row" key={r.resourceId}>
          <span><Box size={14} /> {r.resourceName}</span>
          <span className="cl-tag cl-tag--blue">{r.quantity ?? r.qty} Allocated</span>
        </div>
      ))}
    </div>
  );
}

/** @param {Array} staff - accepted staff assignments [{ id, staffName, role }] */
export function LiveStaffSection({ staff = [] }) {
  return (
    <div className="card">
      <div className="cl-card-title"><Users size={18} /> Assigned Staff Status</div>
      {staff.length === 0 && <div className="cl-client-muted">No staff have accepted this event yet.</div>}
      <div className="cl-staff-row">
        {staff.map((a) => (
          <div className="cl-staff-card" key={a.id}>
            <div className="cl-avatar">{initials(a.staffName)}</div>
            <div>
              <h4>{a.staffName}</h4>
              <p>{a.role || a.staffRole || "Team Member"}</p>
              <span className="cl-tag cl-tag--green"><Circle size={8} fill="currentColor" /> Active</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LiveQuickActions() {
  return (
    <div className="card">
      <div className="cl-card-title"><Zap size={18} /> Quick Actions</div>
      <div className="cl-btn-row">
        <Link to="/client/report-issue" className="cl-btn-pink"><Headphones size={16} /> Request Support</Link>
        <Link to="/client/messages" className="cl-btn-ghost"><MessageCircle size={16} /> Contact Coordinator</Link>
        <Link to="/client/events" className="cl-btn-ghost"><ArrowLeft size={16} /> Back to My Events</Link>
      </div>
    </div>
  );
}
