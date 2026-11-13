/**
 * ============================================================================
 * VENDOR STAFF CARD COMPONENT (StaffCard.jsx)
 * ============================================================================
 * Role: Modular Staff Profile Card (Vendor Staff Portal)
 * Location: src/components/vendor/StaffCard.jsx
 *
 * Parent / Invocation Context:
 *   - Called By: src/components/vendor/StaffGrid.jsx
 *   - Parent Component: <StaffGrid> (renders inside staff items mapping loop)
 *
 * Purpose:
 *   Renders an interactive card representing an individual staff team member:
 *     1. Displays avatar initials with color gradient, full name, role, and status badge.
 *     2. Presents contact metadata (phone and email).
 *     3. Visualizes current task workload percentage with color-coded capacity meter.
 *     4. Provides direct action buttons for:
 *         - Assign: Assign a task to an approved event.
 *         - Schedule: Inspect assigned events and schedule.
 *         - Edit: Modify staff profile attributes.
 *         - Delete: Remove staff member with confirmation safeguard.
 *
 * Props:
 *   @param {Object} props.staff - Staff data record
 *   @param {number} props.index - Numeric index used for fallback color cycling
 *   @param {Function} props.onAssign - Callback when clicking Assign
 *   @param {Function} props.onSchedule - Callback when clicking Schedule
 *   @param {Function} props.onEdit - Callback when clicking Edit
 *   @param {Function} props.onDelete - Callback when clicking Delete
 * ============================================================================
 */

import React from "react";
import {
  Phone,
  Mail,
  Activity,
  CalendarPlus,
  Calendar,
  Pencil,
  Trash2,
} from "lucide-react";

const AVATAR_COLORS = ["pink", "teal", "purple", "green", "orange"];

function StaffCard({
  staff,
  index = 0,
  onAssign,
  onSchedule,
  onEdit,
  onDelete,
}) {
  const {
    name = "Staff Member",
    role = "Team Member",
    phone = "",
    email = "",
    workload = 0,
    status = "available",
    avatar,
    initials,
  } = staff;

  // Determine workload level for styling
  const workloadNum = Math.min(Math.max(0, parseInt(workload, 10) || 0), 100);
  const workloadLvl = workloadNum < 50 ? "low" : workloadNum < 80 ? "medium" : "high";

  // Derive initials
  const displayInitials =
    initials ||
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ||
    "ST";

  // Avatar gradient color
  const avatarClass = avatar || AVATAR_COLORS[index % AVATAR_COLORS.length];

  // Normalized status string
  const normalizedStatus = (status || "available").toLowerCase();

  // Determine if staff is assigned to an event
  const isAssigned =
    staff.isAssigned ??
    (
      (Array.isArray(staff.assignedEvents) && staff.assignedEvents.length > 0) ||
      ["assigned", "busy"].includes(normalizedStatus) ||
      Number(staff.events || 0) > 0
    );

  // If workload is above 80%, neither Assign nor Assign Extra Work button should display
  const isWorkloadAbove80 = workloadNum >= 80;
  const showAssignBtn = !isWorkloadAbove80;

  return (
    <div className="staff-card" data-id={staff.id}>
      {/* ── 1. Card Header: Avatar, Name, Role & Status Badge ── */}
      <div className="staff-card__header">
        <div className="staff-card__info">
          <div className={`staff-avatar avatar--${avatarClass}`}>
            {displayInitials}
          </div>
          <div>
            <div className="staff-name">{name}</div>
            <div className="staff-role">{role}</div>
          </div>
        </div>
        <span className={`staff-status ${normalizedStatus}`}>
          {normalizedStatus === "off" ? "Off Duty" : normalizedStatus}
        </span>
      </div>

      {/* ── 2. Contact Metadata ── */}
      <div className="staff-card__contact">
        <div className="contact-row">
          <Phone size={14} />
          <span>{phone || "—"}</span>
        </div>
        <div className="contact-row">
          <Mail size={14} />
          <span>{email || "—"}</span>
        </div>
      </div>

      {/* ── 3. Workload Meter ── */}
      <div className="staff-card__workload">
        <div className="workload-header">
          <span className="workload-label">
            <Activity size={13} />
            <span>Workload</span>
          </span>
          <span className={`workload-pct ${workloadLvl}`}>{workloadNum}%</span>
        </div>
        <div className="workload-bar-bg">
          <div
            className={`workload-bar-fill ${workloadLvl}`}
            style={{ width: `${workloadNum}%` }}
          />
        </div>
      </div>

      {/* ── 4. Card Actions: Assign / Assign Extra Work, Schedule, Edit, Delete ── */}
      <div
        className="staff-card__actions"
        style={{
          gridTemplateColumns: !showAssignBtn
            ? "repeat(3, 1fr)"
            : isAssigned
            ? "1.45fr 1fr 1fr 1fr"
            : "repeat(4, 1fr)",
        }}
      >
        {/* Render Assign or Assign Extra Work ONLY if workload is below 80% */}
        {showAssignBtn && (
          <button
            type="button"
            className={`staff-btn staff-btn--assign ${isAssigned ? "staff-btn--extra-work" : ""}`}
            onClick={() => onAssign(staff)}
            title={isAssigned ? `Assign extra work to ${name}` : `Assign task to ${name}`}
            style={
              isAssigned
                ? {
                    background: "rgba(168, 85, 247, 0.16)",
                    color: "#c084fc",
                    borderColor: "rgba(168, 85, 247, 0.35)",
                    fontSize: "11px",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    padding: "8px 2px",
                  }
                : undefined
            }
          >
            <CalendarPlus size={13} />
            <span>{isAssigned ? "Assign Extra Work" : "Assign"}</span>
          </button>
        )}

        <button
          type="button"
          className="staff-btn staff-btn--schedule"
          onClick={() => onSchedule(staff)}
          title={`View schedule for ${name}`}
        >
          <Calendar size={13} />
          <span>Schedule</span>
        </button>

        <button
          type="button"
          className="staff-btn staff-btn--edit"
          onClick={() => onEdit(staff)}
          title={`Edit ${name}`}
        >
          <Pencil size={13} />
          <span>Edit</span>
        </button>

        <button
          type="button"
          className="staff-btn staff-btn--delete"
          onClick={() => onDelete(staff)}
          title={`Remove ${name}`}
        >
          <Trash2 size={13} />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
}

export default React.memo(StaffCard);
