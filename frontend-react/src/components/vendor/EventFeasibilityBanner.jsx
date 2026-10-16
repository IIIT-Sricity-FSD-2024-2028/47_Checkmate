/**
 * ============================================================================
 * EVENT FEASIBILITY BANNER COMPONENT (EventFeasibilityBanner.jsx)
 * ============================================================================
 * Role: Reusable Component (Vendor Portal)
 * Location: src/components/vendor/EventFeasibilityBanner.jsx
 *
 * Purpose:
 *   Renders a clear, high-visibility decision banner:
 *     - If both resources and staff are sufficient: Shows a reassuring green
 *       banner confirming the event is ready to be accepted.
 *     - If shortages exist: Shows an alert banner highlighting that items
 *       or roles need attention before accepting.
 *
 * Props:
 *   @param {boolean} props.isFullyFeasible - True if both resources and staff are sufficient
 * ============================================================================
 */

import React from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";

function EventFeasibilityBanner({ isFullyFeasible }) {
  return (
    <div className="er-feasibility-wrap" role="status" aria-live="polite">
      {isFullyFeasible ? (
        /* ── State 1: All Resources & Staff are Fully Available (Green Banner) ── */
        <div className="conflicts-box-safe">
          <div className="conflicts-box-safe-icon">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <div className="conflicts-box-safe-title">
              All Resources &amp; Staff are Available
            </div>
            <div className="conflicts-box-safe-sub">
              Required inventory and staff coverage are ready. You can safely accept this event request.
            </div>
          </div>
        </div>
      ) : (
        /* ── State 2: Inventory or Staffing Shortages Detected (Alert Banner) ── */
        <div className="conflicts-box-danger">
          <div className="conflicts-header">
            <div className="conflicts-icon-bubble">
              <AlertTriangle size={16} />
            </div>
            <span>Inventory or Staff Shortage Detected</span>
          </div>
          <div className="conflicts-desc">
            One or more requested resources or staff members are currently depleted or unassigned. Review the tables below before accepting.
          </div>
        </div>
      )}
    </div>
  );
}

export default EventFeasibilityBanner;
