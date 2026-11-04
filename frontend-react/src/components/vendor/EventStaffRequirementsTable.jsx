/**
 * ============================================================================
 * EVENT STAFF REQUIREMENTS TABLE (EventStaffRequirementsTable.jsx)
 * ============================================================================
 * Role: Reusable Component (Vendor Portal)
 * Location: src/components/vendor/EventStaffRequirementsTable.jsx
 *
 * Purpose:
 *   Replicates legacy Event Review Staff Requirements table workflow:
 *     - Header with "+ Allocate Extra Staff" action trigger
 *     - Role-by-role staffing availability check
 *     - Buffer calculations (+/- delta capacity)
 *     - Status badges: Safe, Risk, Critical
 *     - Action controls: Direct "+ Assign" button, "✓ Assigned", or "⚠ Conflict"
 * ============================================================================
 */

import React from "react";
import { Users, Plus } from "lucide-react";

function EventStaffRequirementsTable({
  requirements = [],
  onAssign,
  onOpenExtraModal,
}) {
  return (
    <div className="client-req-card er-card-section" id="staffReqSection">
      {/* ── Section Header with Title and Allocate Extra Staff Button ── */}
      <div className="er-section-header">
        <h3 className="section-title">
          <Users size={16} className="er-title-icon er-title-icon--blue" />
          Staff Requirements
        </h3>

        <button
          type="button"
          className="btn-alloc-extra-staff"
          onClick={onOpenExtraModal}
          title="Assign an additional available staff member"
        >
          <Plus size={14} /> Allocate Extra Staff
        </button>
      </div>

      {/* ── Table Wrapper ── */}
      <div className="req-wrap">
        <table className="req-table">
          <thead>
            <tr>
              <th>Staff Name</th>
              <th>Role</th>
              <th className="text-center">Required</th>
              <th className="text-center">Available</th>
              <th className="text-right">Buffer</th>
              <th className="text-right">Status</th>
              <th className="text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {requirements.length > 0 ? (
              requirements.map((st, index) => {
                const reqQty = 1;
                const isAvail = st.isAvailable;
                const availQty = isAvail ? 1 : 0;
                const buffer = availQty - reqQty;
                const bufferClass = buffer >= 0 ? "zero" : "neg";
                const statusBadge = st.isAssigned
                  ? "safe"
                  : isAvail
                  ? "safe"
                  : "risk";

                return (
                  <tr key={st.id || index}>
                    {/* Staff Name */}
                    <td>{st.name}</td>

                    {/* Assigned / Requested Role */}
                    <td>{st.role || "Event Staff"}</td>

                    {/* Required Capacity */}
                    <td className="col-num">{reqQty}</td>

                    {/* Available Capacity */}
                    <td className="col-num">{availQty}</td>

                    {/* Buffer Difference */}
                    <td className={`buffer-val ${bufferClass}`}>
                      {buffer >= 0 ? `+${buffer}` : buffer}
                    </td>

                    {/* Status Badge */}
                    <td className="text-right">
                      <span className={`row-status ${statusBadge}`}>
                        {statusBadge}
                      </span>
                    </td>

                    {/* Action Column */}
                    <td className="text-center">
                      {st.isAssigned ? (
                        <span className="row-status safe">✓ Assigned</span>
                      ) : !isAvail ? (
                        <span className="row-status critical">⚠ Conflict</span>
                      ) : (
                        <button
                          type="button"
                          className="er-btn-action-assign"
                          onClick={() => onAssign && onAssign(st)}
                          title={`Assign ${st.name} to this event`}
                        >
                          + Assign
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="vendor-table-message text-center">
                  No staff requirements specified for this event.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default React.memo(EventStaffRequirementsTable);
