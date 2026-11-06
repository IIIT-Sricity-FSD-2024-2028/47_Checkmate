/**
 * ============================================================================
 * ISSUE FORM (IssueForm.jsx)
 * ============================================================================
 * Role: Form Component (Report Issue page)
 * Location: src/components/client/IssueForm.jsx
 *
 * Purpose:
 *   The issue form card. The last field changes with the tab:
 *     - "event" tab -> Related Event (optional, your live events)
 *     - "admin" tab -> Issue Category (required)
 *   Also shows the reporter's name / role / email (read-only) and the
 *   Cancel + Submit buttons with Submitting... / Sent Successfully states.
 *
 * Props: everything comes from useReportIssueForm() — see the page file.
 * ============================================================================
 */

import React from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

const PRIORITIES = [
  { value: "Critical", label: "🔴 Critical" },
  { value: "High", label: "🟠 High" },
  { value: "Medium", label: "🟡 Medium" },
  { value: "Low", label: "🟢 Low" },
];
const ADMIN_CATEGORIES = ["Platform Bug", "Payment Issue", "Account Problem", "Feature Request", "Other"];

function IssueForm({ tab, form, onChange, liveEvents, user, error, submitState, onSubmit, onCancel }) {
  const isEventTab = tab === "event";

  return (
    <div className="card">
      {/* ── Header ── */}
      <div className="cl-form-header">
        <div className="cl-form-header__icon"><AlertCircle size={20} /></div>
        <div>
          <h3>{isEventTab ? "Report an Issue" : "Report Issue to Admin"}</h3>
          <p>Help us resolve issues quickly by providing detailed information</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="cl-form-grid">
          <div className="cl-field cl-full">
            <label>Issue Title *</label>
            <input className="cl-input" type="text" placeholder="Brief description of the issue"
              value={form.title} onChange={(e) => onChange("title", e.target.value)} />
          </div>
          <div className="cl-field cl-full">
            <label>Detailed Description *</label>
            <textarea className="cl-input" rows="5" placeholder="Provide as much detail as possible about the issue"
              value={form.desc} onChange={(e) => onChange("desc", e.target.value)} />
          </div>
          <div className="cl-field">
            <label>Priority Level *</label>
            <select className="cl-input" value={form.priority} onChange={(e) => onChange("priority", e.target.value)}>
              <option value="" disabled>Select Priority</option>
              {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>

          {/* Event tab: related event / Admin tab: category */}
          {isEventTab ? (
            <div className="cl-field">
              <label>Related Event (Optional)</label>
              <select className="cl-input" value={form.eventId} onChange={(e) => onChange("eventId", e.target.value)}>
                <option value="">{liveEvents.length ? "Select Event" : "No live events"}</option>
                {liveEvents.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
              </select>
            </div>
          ) : (
            <div className="cl-field">
              <label>Issue Category *</label>
              <select className="cl-input" value={form.category} onChange={(e) => onChange("category", e.target.value)}>
                <option value="" disabled>Select Category</option>
                {ADMIN_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* ── Reporter details (from the session) ── */}
        <div className="cl-reporter">
          <h4>Reporter Information</h4>
          <div className="cl-reporter__grid">
            <div>Name: <span>{user.name}</span></div>
            <div>Role: <span>{user.roleLabel}</span></div>
            <div className="cl-full">Email: <span>{user.email || "—"}</span></div>
          </div>
        </div>

        {error && <div className="cl-client-error">{error}</div>}

        <div className="cl-btn-row cl-btn-row--end">
          <button type="button" className="cl-btn-ghost" onClick={onCancel}>Cancel</button>
          <button type="submit" className={`cl-btn-pink ${submitState === "success" ? "is-success" : ""}`}
            disabled={submitState !== "idle"}>
            {submitState === "idle" && <><AlertCircle size={16} /> {isEventTab ? "Submit Issue" : "Submit Issue Report"}</>}
            {submitState === "submitting" && <><Loader2 size={16} className="cl-spin" /> Submitting...</>}
            {submitState === "success" && <><CheckCircle2 size={16} /> Sent Successfully</>}
          </button>
        </div>
      </form>
    </div>
  );
}

export default IssueForm;
