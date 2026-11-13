/**
 * ============================================================================
 * EVENT KEEP WAITING MODAL (EventKeepWaitingModal.jsx)
 * ============================================================================
 * Role: Reusable Component (Vendor Portal)
 * Location: src/components/vendor/EventKeepWaitingModal.jsx
 *
 * Purpose:
 *   Displays a modal dialog allowing the vendor to place an event on hold
 *   ("Keep Waiting") when conflicts cannot be immediately resolved:
 *     - Vendor inputs a custom explanation/reason for the wait.
 *     - Provides quick-fill suggested reason chips for fast operation.
 *     - Upon submission, notifies the client with the reason.
 * ============================================================================
 */

import React, { useState } from "react";
import { Clock, Send, X } from "lucide-react";

const SUGGESTED_REASONS = [
  "Awaiting supplier inventory restocking",
  "Confirming staff replacement and shift availability",
  "Verifying venue setup hours and power compatibility",
  "Equipment inspection and testing in progress",
];

function EventKeepWaitingModal({
  isOpen,
  onClose,
  eventName = "Event",
  eventId = "",
  onSubmit,
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Please provide a reason to notify the client.");
      return;
    }

    if (onSubmit) {
      onSubmit(reason.trim());
    }
    setReason("");
    setError("");
    onClose();
  };

  const handleChipClick = (text) => {
    setReason(text);
    setError("");
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        className="modal-card"
        style={{
          background: "var(--bg-sidebar, #130a1c)",
          border: "1px solid var(--border, rgba(255, 255, 255, 0.12))",
          borderRadius: "16px",
          width: "min(540px, 94vw)",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Keep Event Waiting Reason"
      >
        {/* ── Modal Header ── */}
        <div
          style={{
            padding: "18px 22px",
            borderBottom: "1px solid var(--border, rgba(255, 255, 255, 0.08))",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "rgba(217, 119, 6, 0.2)",
                color: "#fbbf24",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Clock size={16} />
            </div>
            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "15px",
                  color: "var(--text-primary, #f0e8ff)",
                }}
              >
                Keep Event Waiting
              </div>
              <div style={{ fontSize: "11.5px", color: "var(--text-muted, #6b5d7e)" }}>
                Event: {eventName} {eventId ? `(${eventId})` : ""}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted, #6b5d7e)",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Modal Body ── */}
        <form onSubmit={handleSubmit} style={{ padding: "18px 22px" }}>
          <div style={{ marginBottom: "12px" }}>
            <label
              htmlFor="waitingReasonText"
              style={{
                display: "block",
                fontSize: "12.5px",
                fontWeight: 600,
                color: "var(--text-primary, #f0e8ff)",
                marginBottom: "6px",
              }}
            >
              Reason for Wait / Delay (Sent to Client)
            </label>
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-muted, #6b5d7e)",
                marginBottom: "10px",
                lineHeight: 1.4,
              }}
            >
              The event review will be marked as waiting, and the client will be notified
              with this explanation.
            </p>

            <textarea
              id="waitingReasonText"
              className="waiting-reason-textarea"
              placeholder="e.g. Waiting for additional audio equipment from our supplier, expected by tomorrow morning..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError("");
              }}
            />

            {error && (
              <div
                style={{
                  color: "#f87171",
                  fontSize: "11.5px",
                  marginTop: "6px",
                  fontWeight: 500,
                }}
              >
                {error}
              </div>
            )}
          </div>

          {/* Quick Reason Suggestions */}
          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                fontSize: "11px",
                color: "var(--text-muted, #6b5d7e)",
                textTransform: "uppercase",
                letterSpacing: "0.4px",
                marginBottom: "6px",
                fontWeight: 600,
              }}
            >
              Suggested Quick Reasons:
            </div>
            <div className="waiting-chips-container">
              {SUGGESTED_REASONS.map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="waiting-reason-chip"
                  onClick={() => handleChipClick(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Modal Actions */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              borderTop: "1px solid var(--border, rgba(255, 255, 255, 0.08))",
              paddingTop: "16px",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 18px",
                borderRadius: "8px",
                border: "1px solid var(--border, rgba(255, 255, 255, 0.12))",
                background: "transparent",
                color: "var(--text-secondary, #9b8db0)",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              Cancel
            </button>

            <button type="submit" className="waiting-submit-btn">
              <Send size={14} /> Submit &amp; Notify Client
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default React.memo(EventKeepWaitingModal);
