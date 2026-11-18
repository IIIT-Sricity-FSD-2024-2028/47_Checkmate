/**
 * ============================================================================
 * COMPONENT: ReasonModal.jsx (+ ReasonPicker) — shared by every Reject / Cancel
 * ============================================================================
 * WHAT IT DOES:
 *   Asks WHY before something is rejected, cancelled or declined. The same five
 *   choices everywhere:
 *     Schedule conflict · Budget issue · Venue/resource unavailable ·
 *     Personal reason · Other (+ text, required)
 *   Any choice can carry extra details. The result is one readable string, e.g.
 *   "Budget issue: costs went over our limit", which the backend saves next to
 *   who did it and shows to the other party.
 *
 * USED BY:
 *   client My Events (Cancel), vendor Event Review (Reject), staff Assigned
 *   Events (Decline), admin Vendor Approvals (Reject) + Monitor Events (Cancel &
 *   Refund, via ReasonPicker), superuser Events (Cancel).
 *
 * PROPS (ReasonModal):
 *   open, title, hint, confirmLabel, onClose, onConfirm(reasonText) (async ok)
 * PROPS (ReasonPicker): value { option, details }, onChange(nextValue)
 * ============================================================================
 */

import { useState } from "react";
import Modal from "./Modal";
import "../styles/reason-modal.css";

// The fixed list of reasons (same for every role)
export const REASON_OPTIONS = [
  "Schedule conflict",
  "Budget issue",
  "Venue/resource unavailable",
  "Personal reason",
  "Other",
];

/** Turns the picker value into the text that is saved: "Budget issue: details". */
export function reasonText({ option, details }) {
  const extra = String(details || "").trim();
  if (!option) return "";
  if (option === "Other") return extra ? `Other: ${extra}` : "";
  return extra ? `${option}: ${extra}` : option;
}

/** The radio list + details box, usable inside any existing modal. */
export function ReasonPicker({ value, onChange }) {
  return (
    <div className="reason-picker">
      {REASON_OPTIONS.map((option) => (
        <label key={option} className={`reason-option ${value.option === option ? "reason-option--on" : ""}`}>
          <input
            type="radio"
            name="reason-option"
            value={option}
            checked={value.option === option}
            onChange={() => onChange({ ...value, option })}
          />
          {option}
        </label>
      ))}
      <textarea
        className="reason-details"
        rows="3"
        maxLength={400}
        placeholder={value.option === "Other" ? "Please describe the reason (required)" : "Add details (optional)"}
        value={value.details}
        onChange={(e) => onChange({ ...value, details: e.target.value })}
      />
    </div>
  );
}

function ReasonModal({ open, title, hint = "", confirmLabel = "Confirm", onClose, onConfirm }) {
  // The chosen option + optional details
  const [value, setValue] = useState({ option: "", details: "" });

  // True while onConfirm runs (disables the buttons)
  const [saving, setSaving] = useState(false);

  // Message from a failed save
  const [error, setError] = useState("");

  const text = reasonText(value);

  // Closes and forgets what was typed
  function handleClose() {
    setValue({ option: "", details: "" });
    setError("");
    onClose();
  }

  // Sends the reason text to the page; the page does the API call
  async function handleConfirm() {
    if (!text) return;
    setSaving(true);
    setError("");
    try {
      await onConfirm(text);
      setValue({ option: "", details: "" });
    } catch (err) {
      setError(err?.message || "Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title={title}
      onClose={handleClose}
      width={500}
      footer={
        <>
          <button type="button" className="reason-btn reason-btn--ghost" onClick={handleClose} disabled={saving}>Back</button>
          <button type="button" className="reason-btn reason-btn--danger" onClick={handleConfirm} disabled={!text || saving}>
            {saving ? "Saving..." : confirmLabel}
          </button>
        </>
      }
    >
      {hint && <p className="reason-hint">{hint}</p>}
      <ReasonPicker value={value} onChange={setValue} />
      {error && <div className="reason-error">{error}</div>}
    </Modal>
  );
}

export default ReasonModal;
