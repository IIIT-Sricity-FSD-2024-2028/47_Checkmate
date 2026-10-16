/**
 * ============================================================================
 * REJECTION REASON MODAL (RejectionReasonModal.jsx)
 * ============================================================================
 * Role: Popup Dialog (Client My Events page)
 * Location: src/components/client/RejectionReasonModal.jsx
 *
 * Purpose:
 *   Shows why the vendor rejected an event: the written reason plus every
 *   recorded conflict (type, description, severity pill).
 *
 * Reusable Components Utilized:
 *   - <Modal>: Shared dialog (closes on backdrop click, X button or Escape).
 *
 * Props:
 *   @param {Object|null} event - The rejected event (null = closed)
 *   @param {Function} onClose - Closes the popup
 * ============================================================================
 */

import React from "react";
import Modal from "../Modal";

function RejectionReasonModal({ event, onClose }) {
  const conflicts = event?.conflicts || [];

  return (
    <Modal
      open={Boolean(event)}
      title={event ? `Event Rejected · ${event.name} (${event.id})` : ""}
      onClose={onClose}
      width={520}
      footer={<button type="button" className="cl-btn-ghost" onClick={onClose}>Close</button>}
    >
      {event && (
        <>
          <div className="cl-label">Rejection Reason</div>
          <div className="cl-reason-box">{event.rejectionReason || "Rejected by vendor."}</div>

          {conflicts.length > 0 && (
            <>
              <div className="cl-label">Conflicts ({conflicts.length})</div>
              {conflicts.map((c, i) => (
                <div className="cl-conflict" key={i}>
                  <div>
                    <div className="cl-conflict__type">{c.type}</div>
                    <div className="cl-conflict__desc">{c.desc}</div>
                  </div>
                  <span className={`cl-severity cl-severity--${c.severity === "high" ? "high" : "low"}`}>{c.severity}</span>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </Modal>
  );
}

export default RejectionReasonModal;
