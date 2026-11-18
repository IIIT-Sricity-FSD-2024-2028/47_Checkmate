/**
 * ============================================================================
 * REJECT REASON MODAL (RejectReasonModal.jsx)
 * ============================================================================
 * Role: Popup Dialog (Vendor Events + Event Review pages)
 * Location: src/components/vendor/RejectReasonModal.jsx
 *
 * Purpose:
 *   Client <-> vendor bridge: before rejecting an event the vendor picks one of
 *   the standard reasons (ReasonPicker: Schedule conflict, Budget issue,
 *   Venue/resource unavailable, Personal reason, Other + text). The reason is sent with the status change
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
import { ReasonPicker, reasonText } from "../ReasonModal";

function RejectReasonModal({ event, onClose, onConfirm }) {
  // Chosen reason option + optional details
  const [value, setValue] = useState({ option: "", details: "" });

  // True while the rejection is being saved
  const [saving, setSaving] = useState(false);

  const reason = reasonText(value);

  // Sends the reason with the rejection, then clears the picker
  const handleConfirm = async () => {
    setSaving(true);
    await onConfirm(reason);
    setSaving(false);
    setValue({ option: "", details: "" });
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
          <button type="button" className="btn-reject" disabled={!reason || saving} onClick={handleConfirm}>
            <X size={15} /> {saving ? "Rejecting..." : "Reject Event"}
          </button>
        </>
      }
    >
      <p className="reject-modal__hint">The client will see this reason on their My Events page and in their notifications.</p>
      <ReasonPicker value={value} onChange={setValue} />
    </Modal>
  );
}

export default RejectReasonModal;
