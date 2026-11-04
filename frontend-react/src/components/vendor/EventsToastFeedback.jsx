/**
 * ============================================================================
 * VENDOR EVENTS TOAST FEEDBACK (EventsToastFeedback.jsx)
 * ============================================================================
 * Role: Feedback Notification Banner (Vendor Events Portal)
 * Location: src/components/vendor/EventsToastFeedback.jsx
 *
 * Parent / Invocation Context:
 *   - Called By:
 *       • src/pages/vendor/Events.jsx (Lines 93–96)
 *       • src/pages/vendor/PresetPackage.jsx (Lines 94–97)
 *       • src/pages/vendor/ClientIssues.jsx (Lines 95–96)
 *       • Also used across client pages (CreateEvent.jsx, Billing.jsx, ReportIssue.jsx)
 *   - Where in Code: Rendered at the top of the `.vendor-content` wrapper to give instant
 *     optimistic confirmation or error feedback after user actions.
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
  // --------------------------------------------------------------------------
  // 1. VISIBILITY GUARD CHECK
  // --------------------------------------------------------------------------
  // If no toast message payload exists in active state, render nothing
  if (!toast) return null;

  // --------------------------------------------------------------------------
  // 2. RENDER FEEDBACK BANNER
  // --------------------------------------------------------------------------
  return (
    <div
      className={`toast-feedback toast-feedback--${toast.type || "info"}`}
      role="alert"
      aria-live="polite"
    >
      {/* ── Content Row: Contextual Icon & Message Text ── */}
      <div className="toast-feedback__content">
        {toast.type === "success" && <CheckCircle2 size={16} className="toast-icon" />}
        {toast.type === "danger" && <AlertCircle size={16} className="toast-icon" />}
        {(!toast.type || toast.type === "info") && <Info size={16} className="toast-icon" />}
        <span className="toast-feedback__text">{toast.text}</span>
      </div>

      {/* ── Manual Dismiss Trigger ── */}
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
