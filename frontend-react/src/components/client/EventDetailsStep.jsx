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
import VenuePicker from "./VenuePicker";
import { ArrowLeft, ArrowRight, CalendarDays, Clock, MapPin, Sparkles, Wallet } from "lucide-react";
import { describeEventDuration } from "../../utils/clientHelpers";

const EVENT_TYPES = ["Wedding", "Birthday", "Conference", "Party", "Corporate"];
const BUDGET_RANGES = ["₹1,000 - ₹5,000", "₹5,000 - ₹15,000", "₹15,000 - ₹30,000", "₹30,000 - ₹50,000", "₹50,000+"];

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

// Opens the browser's date/time picker when the field is clicked
const openPicker = (e) => {
  try {
    e.target.showPicker?.();
  } catch {}
};

// "18:00" to "21:30" -> "3h 30m"
// Duration hint, e.g. "3h 30m"; counts the End Date so overnight events work
function describeDuration(form) {
  return describeEventDuration(form);
}

function Section({ icon: Icon, title, hint, children }) {
  return (
    <section className="cl-form-section">
      <div className="cl-form-section__head">
        <span className="cl-form-section__icon"><Icon size={16} /></span>
        <div>
          <h4>{title}</h4>
          {hint && <p>{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function EventDetailsStep({ form, errors, onChange, onNext }) {
  const inputClass = (field) => `cl-input ${errors[field] ? "input-error" : ""}`;
  const todayStr = new Date().toISOString().split("T")[0];

  const duration = describeDuration(form);

  return (
    <div className="card cl-details-card">
      <h3 className="cl-section-title"><CalendarDays size={20} color="var(--pink)" /> General Details</h3>
      <p className="cl-section-sub">Tell us about your event. Fields marked * are required.</p>

      <Section icon={Sparkles} title="About the event">
        <div className="cl-form-grid">
          <Field label="Event Name *" error={errors.name} full>
            <input id="fieldEventName" name="name" className={inputClass("name")} type="text"
              placeholder="E.g., Sarah & Mike's Wedding" value={form.name}
              onChange={(e) => onChange("name", e.target.value)} />
          </Field>
          <Field label="Event Type *" error={errors.type} full>
            <div className="cl-chip-group" role="radiogroup" aria-label="Event type">
              {EVENT_TYPES.map((t) => (
                <button key={t} type="button" role="radio" aria-checked={form.type === t}
                  className={`cl-chip-option ${form.type === t ? "selected" : ""}`}
                  onClick={() => onChange("type", t)}>
                  {t}
                </button>
              ))}
            </div>
          </Field>
        </div>
      </Section>

      <Section icon={Clock} title="When" hint={duration ? `Duration: ${duration}` : undefined}>
        <div className="cl-form-grid cl-form-grid--4">
          <Field label="Event Date *" error={errors.date}>
            <input id="fieldEventDate" name="date" className={inputClass("date")} type="date" min={todayStr}
              value={form.date} onChange={(e) => onChange("date", e.target.value)} onClick={openPicker} />
          </Field>
          <Field label="Start Time">
            <input id="fieldEventTime" name="time" className="cl-input" type="time" value={form.time}
              onChange={(e) => onChange("time", e.target.value)} onClick={openPicker} />
          </Field>
          {/* Only needed when the event ends on a later day (e.g. 9 PM to 12 AM) */}
          <Field label="End Date" error={errors.endDate}>
            <input id="fieldEndDate" name="endDate" className={inputClass("endDate")} type="date" min={form.date || todayStr}
              value={form.endDate} placeholder="Same day" onChange={(e) => onChange("endDate", e.target.value)} onClick={openPicker} />
          </Field>
          <Field label="End Time *" error={errors.endTime}>
            <input id="fieldEndTime" name="endTime" className={inputClass("endTime")} type="time" value={form.endTime}
              onChange={(e) => onChange("endTime", e.target.value)} onClick={openPicker} />
          </Field>
        </div>
      </Section>

      <Section icon={MapPin} title="Where and how many">
        <div className="cl-form-grid">
          <Field label="Estimated Guest Count *" error={errors.people}>
            <input id="fieldPeople" name="people" className={inputClass("people")} type="number" min="1"
              placeholder="E.g., 150" value={form.people} onChange={(e) => onChange("people", e.target.value)} />
          </Field>
          <Field label="Venue (Optional)">
            <VenuePicker value={form.venue} onChange={(value) => onChange("venue", value)} />
          </Field>
        </div>
      </Section>

      <Section icon={Wallet} title="Budget and notes">
        <div className="cl-form-grid">
          <Field label="Budget Range (Optional)" full={form.budget !== "custom"}>
            <select id="fieldBudget" name="budget" className="cl-input" value={form.budget}
              onChange={(e) => onChange("budget", e.target.value)}>
              <option value="">Select budget range</option>
              {BUDGET_RANGES.map((b) => <option key={b} value={b}>{b}</option>)}
              <option value="custom">Custom...</option>
            </select>
          </Field>
          {form.budget === "custom" && (
            <Field label="Maximum Budget (₹)">
              <input id="fieldCustomBudget" name="customBudget" className="cl-input" type="number" min="0"
                placeholder="E.g., 25000" value={form.customBudget}
                onChange={(e) => onChange("customBudget", e.target.value)} />
            </Field>
          )}
          <Field label="Additional Notes" full>
            <textarea id="fieldNotes" name="notes" className="cl-input" rows="3"
              placeholder="Any special requirements, dietary needs, or instructions..." value={form.notes}
              onChange={(e) => onChange("notes", e.target.value)} />
          </Field>
        </div>
      </Section>

      <div className="cl-wizard-nav">
        <Link to="/client/dashboard" className="cl-btn-ghost"><ArrowLeft size={16} /> Cancel</Link>
        <button type="button" className="cl-btn-pink" onClick={onNext}>Next: Resources <ArrowRight size={16} /></button>
      </div>
    </div>
  );
}

export default EventDetailsStep;
