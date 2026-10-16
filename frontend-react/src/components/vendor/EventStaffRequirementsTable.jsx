/**
 * ============================================================================
 * EVENT STAFF REQUIREMENTS TABLE COMPONENT (EventStaffRequirementsTable.jsx)
 * ============================================================================
 * Role: Reusable Component (Vendor Portal)
 * Location: src/components/vendor/EventStaffRequirementsTable.jsx
 *
 * Purpose:
 *   Renders the Staffing Feasibility Inspection table:
 *     - Displays each required team role for the event.
 *     - Shows whether a matching active staff member is assigned or available.
 *     - Provides a clear visual badge: "Available" (green) or "Shortage / Unassigned" (red).
 *
 * Props:
 *   @param {Array} props.requirements - List of staff requirement objects:
 *     [{ id, role, name, isAvailable }]
 * ============================================================================
 */

import React from "react";
import { ShieldCheck, Check, X } from "lucide-react";

function EventStaffRequirementsTable({ requirements = [] }) {
  return (
    <div className="client-req-card er-card-section">
      {/* ── Card Header with Icon & Title ── */}
      <div className="er-section-header">
        <h3 className="section-title">
          <ShieldCheck size={16} className="er-title-icon er-title-icon--blue" />
          Required Staff Check
        </h3>
      </div>

      {/* ── Staff Table Wrapper ── */}
      <div className="mr-table-wrap">
        <table className="mr-table">
          <thead>
            <tr>
              <th>Required Role</th>
              <th>Assigned / Available Member</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {requirements.length > 0 ? (
              requirements.map((st, index) => (
                <tr key={st.id || index}>
                  {/* Role Name */}
                  <td className="col-res-name">{st.role}</td>

                  {/* Staff Member Name */}
                  <td>{st.name}</td>

                  {/* Status Badge (Available vs Shortage/Unassigned) */}
                  <td>
                    {st.isAvailable ? (
                      <span className="avail-badge available">
                        <Check size={12} className="er-badge-icon" />
                        Available
                      </span>
                    ) : (
                      <span className="avail-badge unavailable">
                        <X size={12} className="er-badge-icon" />
                        Shortage / Unassigned
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              /* Empty state if no staff requirements were specified */
              <tr>
                <td colSpan="3" className="vendor-table-message">
                  No specific staff requirements specified for this event.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default EventStaffRequirementsTable;
