/**
 * ============================================================================
 * REJECT REASON MODAL (RejectReasonModal.jsx)
 * ============================================================================
 * Role: Popup Dialog (Vendor Events + Event Review pages)
 * Location: src/components/vendor/RejectReasonModal.jsx
 *
 * Purpose:
 *   Client <-> vendor bridge: before rejecting an event the vendor writes a
 *   reason (or taps a quick reason). The reason is sent with the status change
 *   (PATCH /events/:id/status { status: "rejected", note }), saved as the event's
 *   `rejectionReason`, shown in the client's "View Reason" popup and put in the
 *   client's notification.
 *
 * Reusable Components Utilized:
 *   - <Modal>: Shared dialog.
 *
 * Props:
 *   @param {Object|null} event - Event being rejected (null = closed)
 *   @param {Function} onClose - Cancel
 *   @param {Function} onConfirm - async (reason) => void
 * ============================================================================
 */

import React, { useState } from "react";
import { X } from "lucide-react";
import Modal from "../Modal";

const QUICK_REASONS = [
  "Venue is unavailable on the requested date",
  "Requested resources are not available on that date",
  "Our staff are fully booked for that date",
  "Request is outside our service area",
];

function RejectReasonModal({ event, onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    setSaving(true);
    await onConfirm(reason.trim());
    setSaving(false);
    setReason("");
  };

  return (
    <Modal
      open={Boolean(event)}
      title={event ? `Reject "${event.name}"` : ""}
      onClose={onClose}
      width={520}
      footer={
        <>
          <button type="button" className="btn-back" onClick={onClose}>Cancel</button>
          {/* A reason is required so the client always gets an explanation */}
          <button type="button" className="btn-reject" disabled={!reason.trim() || saving} onClick={handleConfirm}>
            <X size={15} /> {saving ? "Rejecting..." : "Reject Event"}
          </button>
        </>
      }
    >
      <p className="reject-modal__hint">The client will see this reason on their My Events page and in their notifications.</p>

      {/* Quick reasons fill the text box with one click */}
      <div className="reject-modal__chips">
        {QUICK_REASONS.map((text) => (
          <button type="button" key={text} className="reject-modal__chip" onClick={() => setReason(text)}>{text}</button>
        ))}
      </div>

      <textarea
        className="reject-modal__input"
        rows="4"
        placeholder="Explain why this request is being rejected..."
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
    </Modal>
  );
}

export default RejectReasonModal;
