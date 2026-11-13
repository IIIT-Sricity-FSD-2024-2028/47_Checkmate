/**
 * ============================================================================
 * VENDOR STAFF SCHEDULE MODAL COMPONENT (StaffScheduleModal.jsx)
 * ============================================================================
 * Role: Schedule Inspection Dialog (Vendor Staff Portal)
 * Location: src/components/vendor/StaffScheduleModal.jsx
 *
 * Parent / Invocation Context:
 *   - Called By: src/pages/vendor/ManageStaff.jsx
 *   - Parent Page: Vendor Manage Staff (src/pages/vendor/ManageStaff.jsx)
 *   - Where in Code: Rendered at the root layout of ManageStaff.jsx; displayed
 *     when `isOpen` is true and `staff` is selected.
 *
 * Purpose:
 *   Displays a comprehensive breakdown of an individual staff member's active
 *   event commitments, event dates, venues, and assigned operational tasks.
 *
 * Props:
 *   @param {boolean} props.isOpen - Whether modal is visible
 *   @param {Object|null} props.staff - Target staff member record
 *   @param {Array} props.assignedEvents - List of events and tasks assigned to this staff member
 *   @param {Function} props.formatDate - Helper to format readable date strings
 *   @param {Function} props.onClose - Callback dismissing modal
 * ============================================================================
 */

import React from "react";
import { X, Calendar, MapPin, Users, CheckCircle2 } from "lucide-react";

function StaffScheduleModal({
  isOpen = false,
  staff = null,
  assignedEvents = [],
  formatDate = (d) => d || "Date TBD",
  onClose,
}) {
  if (!isOpen || !staff) return null;

  return (
    <div className="vendor-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="vendor-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "560px" }}
      >
        {/* ── Modal Header ── */}
        <div className="vendor-modal__header">
          <div>
            <h3>{staff.name} — Schedule</h3>
            <span style={{ fontSize: "12px", color: "var(--text-muted, #6b5d7e)" }}>
              {staff.role} · Current Workload: {staff.workload || 0}%
            </span>
          </div>
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
          {assignedEvents.length > 0 ? (
            <div className="schedule-events-list">
              {assignedEvents.map((evItem) => (
                <div key={evItem.id || evItem.eventId} className="schedule-event-card">
                  {/* Event Title & Status */}
                  <div className="schedule-event-header">
                    <span className="schedule-event-name">{evItem.eventName || evItem.name}</span>
                    <span className="staff-status available">
                      {(evItem.status || "CONFIRMED").toUpperCase()}
                    </span>
                  </div>

                  {/* Date, Venue & Attendee Row */}
                  <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", fontSize: "12px", color: "var(--text-secondary, #9b8db0)" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Calendar size={13} />
                      {formatDate(evItem.eventDate || evItem.date)}
                    </span>
                    {(evItem.eventVenue || evItem.venue) && (
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <MapPin size={13} />
                        {evItem.eventVenue || evItem.venue}
                      </span>
                    )}
                    {(evItem.eventPeople || evItem.people || evItem.guests) && (
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Users size={13} />
                        {evItem.eventPeople || evItem.people || evItem.guests} guests
                      </span>
                    )}
                  </div>

                  {/* Tasks List */}
                  {evItem.tasks && evItem.tasks.length > 0 ? (
                    <div className="schedule-tasks-list">
                      <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted, #6b5d7e)" }}>
                        Assigned Tasks ({evItem.tasks.length})
                      </span>
                      {evItem.tasks.map((task, tIdx) => (
                        <div key={task.id || tIdx} className="schedule-task-item">
                          <span>{task.desc || task.name || task.taskDesc}</span>
                          <span className={`schedule-task-priority ${task.priority || "Medium"}`}>
                            {task.priority || "Medium"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : evItem.taskDesc ? (
                    <div className="schedule-tasks-list">
                      <div className="schedule-task-item">
                        <span>{evItem.taskDesc}</span>
                        <span className={`schedule-task-priority ${evItem.priority || "Medium"}`}>
                          {evItem.priority || "Medium"}
                        </span>
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted, #6b5d7e)" }}>
              <CheckCircle2 size={32} style={{ color: "var(--green, #22c55e)", marginBottom: "8px", opacity: 0.8 }} />
              <p style={{ margin: 0, fontSize: "14px" }}>
                <strong>{staff.name}</strong> currently has no active event assignments or scheduled tasks.
              </p>
            </div>
          )}
        </div>

        {/* ── Modal Footer ── */}
        <div className="vendor-modal__footer">
          <button
            type="button"
            className="mr-filter-reset-btn"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(StaffScheduleModal);
