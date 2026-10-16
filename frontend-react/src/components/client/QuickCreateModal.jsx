/**
 * ============================================================================
 * QUICK CREATE MODAL (QuickCreateModal.jsx)
 * ============================================================================
 * Role: Popup Form (Client Browse Packages page)
 * Location: src/components/client/QuickCreateModal.jsx
 *
 * Purpose:
 *   Small form that turns a package into an event request:
 *   event name (pre-filled "<package> Event"), date*, time, venue, guests.
 *   Validates name + date, then shows Submitting... → Success! and goes to My Events.
 *
 * Reusable Components Utilized:
 *   - <Modal>: Shared dialog.
 *
 * Props:
 *   @param {Object|null} pkg - Package being booked (null = closed)
 *   @param {Function} onClose - Closes the popup
 *   @param {Function} onSubmit - async (pkg, form) => true/false (from the hook)
 * ============================================================================
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import Modal from "../Modal";

// FACULTY MAY ASK: How does the form reset for each package?
// HOW TO CHANGE: The page gives this component key={pkg.id}, so React creates a
// fresh copy (fresh useState) whenever a different package is opened.
function QuickCreateModal({ pkg, onClose, onSubmit }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: pkg ? `${pkg.name} Event` : "", date: "", time: "09:00", venue: "", people: "" });
  const [error, setError] = useState("");
  const [submitState, setSubmitState] = useState("idle"); // idle | submitting | success

  const update = (field, value) => setForm({ ...form, [field]: value });

  const handleCreate = async () => {
    if (!form.name.trim() || !form.date) {
      setError("Please fill in the required Event Name and Date.");
      return;
    }
    setSubmitState("submitting");
    const ok = await onSubmit(pkg, form);
    if (ok) {
      setSubmitState("success");
      setTimeout(() => navigate("/client/events"), 1000);
    } else {
      setSubmitState("idle");
      setError("Could not create the request. Please try again.");
    }
  };

  return (
    <Modal
      open={Boolean(pkg)}
      title={pkg ? `Quick Create: ${pkg.name}` : ""}
      onClose={onClose}
      width={520}
      footer={
        <>
          <button type="button" className="cl-btn-ghost" onClick={onClose}>Cancel</button>
          <button type="button" className={`cl-btn-pink ${submitState === "success" ? "is-success" : ""}`}
            disabled={submitState !== "idle"} onClick={handleCreate}>
            {submitState === "idle" && <><CheckCircle2 size={16} /> Create Request</>}
            {submitState === "submitting" && <><Loader2 size={16} className="cl-spin" /> Submitting...</>}
            {submitState === "success" && <><CheckCircle2 size={16} /> Success!</>}
          </button>
        </>
      }
    >
      <div className="cl-form-grid">
        <div className="cl-field cl-full">
          <label>Event Name *</label>
          <input className="cl-input" type="text" placeholder="E.g., Yearly Summit"
            value={form.name} onChange={(e) => update("name", e.target.value)} />
        </div>
        <div className="cl-field">
          <label>Event Date *</label>
          <input className="cl-input" type="date" value={form.date} onChange={(e) => update("date", e.target.value)} />
        </div>
        <div className="cl-field">
          <label>Event Time</label>
          <input className="cl-input" type="time" value={form.time} onChange={(e) => update("time", e.target.value)} />
        </div>
        <div className="cl-field">
          <label>Venue Location</label>
          <input className="cl-input" type="text" placeholder="E.g., Central Hall"
            value={form.venue} onChange={(e) => update("venue", e.target.value)} />
        </div>
        <div className="cl-field">
          <label>Guests</label>
          <input className="cl-input" type="number" min="0" placeholder="100"
            value={form.people} onChange={(e) => update("people", e.target.value)} />
        </div>
      </div>
      {error && <div className="cl-error">{error}</div>}
    </Modal>
  );
}

export default QuickCreateModal;
