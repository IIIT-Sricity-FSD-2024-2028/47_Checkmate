/**
 * ============================================================================
 * VENDOR EVENTS TOAST FEEDBACK (EventsToastFeedback.jsx)
 * ============================================================================
 * Role: Feedback Notification Banner (Vendor Events Portal)
 * Location: src/components/vendor/EventsToastFeedback.jsx
 *
 * Purpose:
 *   Renders a temporary, dismissible alert toast providing immediate user
 *   feedback when event requests are approved, rejected, or updated.
 *
 * Props:
 *   @param {Object|null} toast - Toast payload { type: 'success'|'danger'|'info', text: string }
 *   @param {Function} onClose - Callback to dismiss the toast
 * ============================================================================
 */

import React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

function EventsToastFeedback({ toast, onClose }) {
  if (!toast) return null;

  return (
    <div
      className={`toast-feedback toast-feedback--${toast.type || "info"}`}
      role="alert"
      aria-live="polite"
    >
      <div className="toast-feedback__content">
        {toast.type === "success" && <CheckCircle2 size={16} className="toast-icon" />}
        {toast.type === "danger" && <AlertCircle size={16} className="toast-icon" />}
        {(!toast.type || toast.type === "info") && <Info size={16} className="toast-icon" />}
        <span className="toast-feedback__text">{toast.text}</span>
      </div>

      <button
        type="button"
        className="toast-feedback__close"
        onClick={onClose}
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default EventsToastFeedback;
