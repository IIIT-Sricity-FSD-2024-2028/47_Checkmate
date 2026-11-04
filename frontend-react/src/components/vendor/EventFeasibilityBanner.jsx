/**
 * ============================================================================
 * EVENT FEASIBILITY & CONFLICT RESOLUTION BANNER (EventFeasibilityBanner.jsx)
 * ============================================================================
 * Role: Reusable Component (Vendor Portal)
 * Location: src/components/vendor/EventFeasibilityBanner.jsx
 *
 * Purpose:
 *   Replicates legacy conflict detection with direct conflict resolution workflows:
 *     - If conflicts exist:
 *         1. Displays each conflict with severity pill and direct navigation buttons:
 *            - "Manage Resources" -> navigates to /vendor/resources to add/edit stock.
 *            - "Manage Staff" -> navigates to /vendor/staff to recruit/manage personnel.
 *         2. "Keep Waiting" button -> opens modal to submit a waiting reason to client.
 *         3. "Reject Event" button -> rejects event with client notification.
 *     - If conflicts are resolved:
 *         Displays reassuring green banner and reveals "Accept Event" trigger!
 * ============================================================================
 */

import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  X,
  Clock,
  ArrowRight,
  Package,
  Users,
  CheckCircle,
} from "lucide-react";

function EventFeasibilityBanner({
  conflicts = [],
  onNavigateResolve,
  onOpenKeepWaiting,
  onReject,
  onAccept,
  eventStatus,
}) {
  const hasConflicts = conflicts.length > 0;
  const isAlreadyProcessed =
    eventStatus === "confirmed" ||
    eventStatus === "approved" ||
    eventStatus === "rejected" ||
    eventStatus === "completed";

  return (
    <div className="conflicts-box-wrapper" role="status" aria-live="polite">
      {hasConflicts ? (
        /* ── State 1: Active Conflicts Detected (Resolution Section) ── */
        <div className="conflicts-box-danger">
          <div className="conflicts-header">
            <div className="conflicts-icon-bubble">
              <AlertTriangle size={18} />
            </div>
            <span>Conflicts Detected ({conflicts.length}) — Resolution Required</span>
          </div>

          <div className="conflicts-desc">
            The following resource or staffing conflicts prevent immediate approval.
            Click &quot;Manage&quot; on any item to navigate to that section to resolve it,
            or click &quot;Keep Waiting&quot; to notify the client of the delay.
          </div>

          {/* Itemized Conflict Cards with Direct Navigation */}
          <div className="conflicts-list">
            {conflicts.map((conflict, idx) => {
              const isResource =
                conflict.category === "resource" ||
                conflict.type.toLowerCase().includes("resource");

              const targetLabel = isResource
                ? "Manage Resources"
                : "Manage Staff";

              const targetPath = isResource
                ? "/vendor/resources"
                : "/vendor/staff";

              const ConflictIcon = isResource ? Package : Users;

              return (
                <div key={`conflict-${idx}`} className="conflict-item-card">
                  <div className="conflict-item-main">
                    <div className="conflict-item-type">{conflict.type}</div>
                    <div className="conflict-item-desc">{conflict.desc}</div>
                  </div>

                  <div className="conflict-item-actions">
                    <span
                      className={`conflict-severity-pill ${
                        conflict.severity === "high" ? "high" : "medium"
                      }`}
                    >
                      {conflict.severity}
                    </span>

                    {/* Direct Navigate to Section Button */}
                    <button
                      type="button"
                      className="btn-resolve-nav"
                      onClick={() =>
                        onNavigateResolve && onNavigateResolve(targetPath)
                      }
                      title={`Resolve conflict: Navigate to ${targetLabel}`}
                    >
                      <ConflictIcon size={13} />
                      <span>Resolve Conflict ({isResource ? "Resources" : "Staff"})</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Row: Keep Waiting & Reject Event */}
          {!isAlreadyProcessed && (
            <div className="conflicts-actions-row">
              <button
                type="button"
                className="btn-keep-waiting"
                onClick={onOpenKeepWaiting}
                title="Put event on wait and specify reason to notify client"
              >
                <Clock size={16} /> Keep Waiting (Notify Client)
              </button>

              <button
                type="button"
                className="btn-conflict-reject"
                onClick={onReject}
                title="Reject this event request"
              >
                <X size={16} /> Reject Event
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ── State 2: No Conflicts Detected (Safe to Approve) ── */
        <div className="conflicts-box-safe">
          <div className="conflicts-box-safe-icon">
            <CheckCircle2 size={20} />
          </div>
          <div className="conflicts-box-safe-body">
            <div className="conflicts-box-safe-title">
              No Conflicts — Safe to Approve
            </div>
            <div className="conflicts-box-safe-sub">
              All requested resources are in stock and assigned staff members are available.
            </div>
          </div>

          {/* If resolved and not yet approved: Prompt Accept Event */}
          {!isAlreadyProcessed && onAccept && (
            <button
              type="button"
              className="btn-approve btn-approve-banner"
              onClick={onAccept}
              title="Accept and approve this event request"
            >
              <CheckCircle size={16} /> Accept Event
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default React.memo(EventFeasibilityBanner);
