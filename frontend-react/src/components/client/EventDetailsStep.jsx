/**
 * ============================================================================
 * CREATE EVENT — STEP 1: EVENT DETAILS (EventDetailsStep.jsx)
 * ============================================================================
 * Role: Wizard Step Component (Client Create Event page)
 * Location: src/components/client/EventDetailsStep.jsx
 *
 * Purpose:
 *   The "General Details" form: name*, type*, date*, time, guests*, venue,
 *   budget range (with a "Custom..." amount box) and notes.
 *   Fields marked * show a red message when empty; the message disappears as
 *   soon as the user types (handled by updateField in the hook).
 *
 * Props:
 *   @param {Object} form - Current form values
 *   @param {Object} errors - { field: message } for invalid fields
 *   @param {Function} onChange - updateField(field, value)
 *   @param {Function} onNext - Validate and go to step 2
 * ============================================================================
 */

import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, CalendarDays } from "lucide-react";

const EVENT_TYPES = ["Wedding", "Birthday", "Conference", "Party", "Corporate"];
const BUDGET_RANGES = ["$1,000 - $5,000", "$5,000 - $15,000", "$15,000 - $30,000", "$30,000 - $50,000", "$50,000+"];

// Small wrapper so every field has the same label + error markup
function Field({ label, error, full, children }) {
  return (
    <div className={`cl-field ${full ? "cl-full" : ""}`}>
      <label>{label}</label>
      {children}
      {error && <span className="cl-error">{error}</span>}
    </div>
  );
}

function EventDetailsStep({ form, errors, onChange, onNext }) {
  const inputClass = (field) => `cl-input ${errors[field] ? "input-error" : ""}`;

  return (
    <div className="card">
      <h3 className="cl-section-title"><CalendarDays size={20} color="var(--pink)" /> General Details</h3>

      <div className="cl-form-grid">
        <Field label="Event Name *" error={errors.name} full>
          <input className={inputClass("name")} type="text" placeholder="E.g., Sarah & Mike's Wedding"
            value={form.name} onChange={(e) => onChange("name", e.target.value)} />
        </Field>

        <Field label="Event Type *" error={errors.type}>
          <select className={inputClass("type")} value={form.type} onChange={(e) => onChange("type", e.target.value)}>
            <option value="" disabled>Select an event type</option>
            {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>

        <Field label="Event Date *" error={errors.date}>
          <input className={inputClass("date")} type="date"
            value={form.date} onChange={(e) => onChange("date", e.target.value)} />
        </Field>

        <Field label="Event Time">
          <input className="cl-input" type="time" value={form.time} onChange={(e) => onChange("time", e.target.value)} />
        </Field>

        <Field label="Estimated Guest Count *" error={errors.people}>
          <input className={inputClass("people")} type="number" min="1" placeholder="E.g., 150"
            value={form.people} onChange={(e) => onChange("people", e.target.value)} />
        </Field>

        <Field label="Venue (Optional)" full>
          <input className="cl-input" type="text" placeholder="E.g., Grand Ballroom, Downtown"
            value={form.venue} onChange={(e) => onChange("venue", e.target.value)} />
        </Field>

        <Field label="Budget Range (Optional)">
          <select className="cl-input" value={form.budget} onChange={(e) => onChange("budget", e.target.value)}>
            <option value="">Select budget range</option>
            {BUDGET_RANGES.map((b) => <option key={b} value={b}>{b}</option>)}
            <option value="custom">Custom...</option>
          </select>
          {/* Only shown when "Custom..." is picked */}
          {form.budget === "custom" && (
            <input className="cl-input" type="number" min="0" placeholder="Enter maximum budget in $"
              value={form.customBudget} onChange={(e) => onChange("customBudget", e.target.value)} />
          )}
        </Field>

        <Field label="Additional Notes" full>
          <textarea className="cl-input" rows="3" placeholder="Any special requirements, dietary needs, or instructions..."
            value={form.notes} onChange={(e) => onChange("notes", e.target.value)} />
        </Field>
      </div>

      <div className="cl-wizard-nav">
        <Link to="/client/dashboard" className="cl-btn-ghost"><ArrowLeft size={16} /> Cancel</Link>
        <button type="button" className="cl-btn-pink" onClick={onNext}><ArrowRight size={16} /> Next: Resources</button>
      </div>
    </div>
  );
}

export default EventDetailsStep;
