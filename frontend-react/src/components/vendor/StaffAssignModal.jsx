/**
 * ============================================================================
 * VENDOR STAFF ASSIGN MODAL COMPONENT (StaffAssignModal.jsx)
 * ============================================================================
 * Role: Task Assignment Dialog (Vendor Staff Portal)
 * Location: src/components/vendor/StaffAssignModal.jsx
 *
 * Parent / Invocation Context:
 *   - Called By: src/pages/vendor/ManageStaff.jsx
 *   - Parent Page: Vendor Manage Staff (src/pages/vendor/ManageStaff.jsx)
 *   - Where in Code: Rendered at the root layout of ManageStaff.jsx; displayed
 *     when `isOpen` is true and `staff` is selected.
 *
 * Purpose:
 *   Assigns a specific operational task to a staff member for an active event:
 *     1. Displays current staff workload meter.
 *     2. Enforces single-event exclusivity constraint (staff can only be deployed
 *        to one event at a time; displays contextual guidance banner).
 *     3. Collects target event selection, task description, and priority level.
 *     4. Adjusts workload capacity (+20%) upon successful assignment.
 *
 * Props:
 *   @param {boolean} props.isOpen - Whether modal is visible
 *   @param {Object|null} props.staff - Target staff member record
 *   @param {Array} props.actionableEvents - Filtered approved/live events available for assignment
 *   @param {string|null} props.restrictedEventId - If staff is already tied to an event, locks assignment to this event
 *   @param {string} props.selectedEventId - Currently selected event ID
 *   @param {string} props.taskName - Input task description
 *   @param {string} props.priority - Selected priority ('High' | 'Medium' | 'Low')
 *   @param {string} props.errorMsg - Validation error string
 *   @param {Function} props.onSelectEvent - Handler when selecting target event
 *   @param {Function} props.onTaskNameChange - Handler on task name input
 *   @param {Function} props.onPriorityChange - Handler on priority select
 *   @param {Function} props.onConfirm - Callback executing task assignment
 *   @param {Function} props.onClose - Callback dismissing modal
 * ============================================================================
 */

import React from "react";
import { X, CalendarPlus, AlertTriangle, CheckCircle2 } from "lucide-react";

function StaffAssignModal({
  isOpen = false,
  staff = null,
  actionableEvents = [],
  restrictedEventId = null,
  selectedEventId = "",
  taskName = "",
  priority = "Medium",
  errorMsg = "",
  onSelectEvent,
  onTaskNameChange,
  onPriorityChange,
  onConfirm,
  onClose,
}) {
  if (!isOpen || !staff) return null;

  const workloadNum = Math.min(Math.max(0, parseInt(staff.workload, 10) || 0), 100);
  const workloadColor = workloadNum >= 80 ? "#ef4444" : workloadNum >= 60 ? "#f59e0b" : "var(--pink, #e91e8c)";

  const restrictedEventName = actionableEvents.find((e) => e.id === restrictedEventId)?.name || restrictedEventId;

  return (
    <div className="vendor-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="vendor-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div className="vendor-modal__header">
          <h3>Assign Task</h3>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Modal Body ── */}
        <div className="vendor-modal__body">
          {/* Target Staff Member Overview */}
          <div style={{ fontSize: "13.5px", color: "var(--text-secondary, #9b8db0)", marginBottom: "4px" }}>
            Assign an event task to{" "}
            <strong style={{ color: "var(--text-primary, #f0e8ff)" }}>{staff.name}</strong>{" "}
            ({staff.role})
          </div>

          {/* Current Workload Meter Card */}
          <div className="assign-workload-box">
            <div className="assign-workload-header">
              <span className="assign-workload-label">Current Workload</span>
              <span className="assign-workload-pct" style={{ color: workloadColor }}>
                {workloadNum}%
              </span>
            </div>
            <div className="workload-bar-bg">
              <div
                className="workload-bar-fill"
                style={{ width: `${workloadNum}%`, background: workloadColor }}
              />
            </div>
          </div>

          {/* Single-Event Constraint Banner */}
          {restrictedEventId ? (
            <div className="assign-event-info-banner assign-event-info--restricted">
              <AlertTriangle size={15} style={{ flexShrink: 0 }} />
              <span>
                <strong>{staff.name}</strong> is currently assigned to{" "}
                <strong>"{restrictedEventName}"</strong>. Staff can only be assigned to one event at a time.
              </span>
            </div>
          ) : (
            <div className="assign-event-info-banner assign-event-info--free">
              <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
              <span>
                <strong>{staff.name}</strong> has no current event assignment. You may assign to any active event.
              </span>
            </div>
          )}

          {/* Event Selection */}
          <div className="form-group" style={{ marginTop: "6px" }}>
            <label className="form-label">Select Event *</label>
            <select
              className="form-input"
              value={selectedEventId}
              onChange={(e) => onSelectEvent(e.target.value)}
              disabled={!!restrictedEventId}
            >
              {actionableEvents.length === 0 ? (
                <option value="">No active events available</option>
              ) : (
                actionableEvents.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name} [{(ev.status || "CONFIRMED").toUpperCase()}]
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Task Name */}
          <div className="form-group">
            <label className="form-label">Task Name *</label>
            <input
              type="text"
              className={`form-input ${errorMsg ? "form-input-error" : ""}`}
              placeholder="e.g. Setup Sound System, Coordinate Guest Entry"
              value={taskName}
              onChange={(e) => onTaskNameChange(e.target.value)}
              autoFocus
            />
            {errorMsg && <span className="form-error-msg">{errorMsg}</span>}
          </div>

          {/* Task Priority */}
          <div className="form-group">
            <label className="form-label">Priority</label>
            <select
              className="form-input"
              value={priority}
              onChange={(e) => onPriorityChange(e.target.value)}
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {/* ── Modal Footer ── */}
        <div className="vendor-modal__footer">
          <button
            type="button"
            className="mr-filter-reset-btn"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="mr-add-btn"
            onClick={onConfirm}
            disabled={!taskName.trim() || actionableEvents.length === 0 || workloadNum >= 100}
          >
            <CalendarPlus size={14} />
            <span>Assign Task</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(StaffAssignModal);
