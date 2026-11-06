/**
 * ============================================================================
 * CREATE EVENT — STEP 4: REVIEW & SUBMIT (ReviewStep.jsx)
 * ============================================================================
 * Role: Wizard Step Component (Client Create Event page)
 * Location: src/components/client/ReviewStep.jsx
 *
 * Purpose:
 *   Read-only summary before submitting:
 *     - Event details grid, requested resources, requested staff,
 *       estimated resource cost per day and notes (sections hide when empty).
 *     - Submit button that shows: Submit → Submitting... → Created! / Could not submit.
 *
 * Props:
 *   @param {Object} form - Step 1 values
 *   @param {string} budgetText - "$1,000 - $5,000" or "$7000" or ""
 *   @param {Array} resources - Chosen resources with qty & cost
 *   @param {Array} staff - Chosen staff
 *   @param {number} subtotal - Daily resource cost
 *   @param {string} submitState - "idle" | "submitting" | "success" | "error"
 *   @param {Function} onBack / onSubmit
 * ============================================================================
 */

import React from "react";
import { AlertTriangle, ArrowLeft, Box, CalendarDays, CheckCircle2, DollarSign, Loader2, NotebookPen, Package, Send, User, UsersRound } from "lucide-react";
import { formatTime12, money } from "../../utils/clientHelpers";

// One label/value box in the details grid
function ReviewField({ label, value, full }) {
  return (
    <div className={`cl-review__field ${full ? "cl-full" : ""}`}>
      <div className="cl-review__label">{label}</div>
      <div className="cl-review__value">{value}</div>
    </div>
  );
}

function ReviewStep({ form, budgetText, resources, staff, subtotal, submitState, onBack, onSubmit }) {
  return (
    <div>
      {/* ── Event details ── */}
      <div className="card cl-review">
        <div className="cl-review__title"><CalendarDays size={16} /> Event Details</div>
        <div className="cl-review__grid">
          <ReviewField label="Event Name" value={form.name.trim() || "Untitled Event"} />
          <ReviewField label="Type" value={form.type || "—"} />
          <ReviewField label="Date" value={form.date || "—"} />
          <ReviewField label="Time" value={formatTime12(form.time)} />
          <ReviewField label="Venue" value={form.venue.trim() || "TBD"} />
          <ReviewField label="Expected Guests" value={form.people || "—"} />
          <ReviewField label="Budget Range" value={budgetText || "—"} full />
        </div>
      </div>

      {/* ── Resources ── */}
      {resources.length > 0 && (
        <div className="card cl-review">
          <div className="cl-review__title"><Package size={16} /> Requested Resources</div>
          <div className="cl-chip-list">
            {resources.map((r) => <span className="cl-chip" key={r.id}><Box size={14} /> {r.name} ×{r.qty} — ${r.cost}/day</span>)}
          </div>
        </div>
      )}

      {/* ── Staff ── */}
      {staff.length > 0 && (
        <div className="card cl-review">
          <div className="cl-review__title"><UsersRound size={16} /> Requested Staff</div>
          <div className="cl-chip-list">
            {staff.map((s) => <span className="cl-chip" key={s.id}><User size={14} /> {s.name} — {s.role}</span>)}
          </div>
        </div>
      )}

      {/* ── Cost ── */}
      {resources.length > 0 && (
        <div className="cl-cost-total">
          <span><DollarSign size={16} /> Estimated Resource Cost</span>
          <strong>{money(subtotal)}/day</strong>
        </div>
      )}

      {/* ── Notes ── */}
      {form.notes.trim() && (
        <div className="card cl-review">
          <div className="cl-review__title"><NotebookPen size={16} /> Additional Notes</div>
          <div className="cl-notes">{form.notes.trim()}</div>
        </div>
      )}

      <div className="cl-wizard-nav">
        <button type="button" className="cl-btn-ghost" onClick={onBack}><ArrowLeft size={16} /> Back</button>
        <button type="button"
          className={`cl-btn-pink cl-submit ${submitState === "success" ? "is-success" : ""} ${submitState === "error" ? "is-error" : ""}`}
          disabled={submitState === "submitting" || submitState === "success"}
          onClick={onSubmit}>
          {submitState === "idle" && <><Send size={16} /> Submit Event Request</>}
          {submitState === "submitting" && <><Loader2 size={16} className="cl-spin" /> Submitting...</>}
          {submitState === "success" && <><CheckCircle2 size={16} /> Event Created Successfully!</>}
          {submitState === "error" && <><AlertTriangle size={16} /> Could not submit — try again</>}
        </button>
      </div>
    </div>
  );
}

export default ReviewStep;
