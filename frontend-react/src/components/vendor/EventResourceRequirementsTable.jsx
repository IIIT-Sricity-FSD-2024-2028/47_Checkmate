/**
 * ============================================================================
 * EVENT RESOURCE REQUIREMENTS TABLE (EventResourceRequirementsTable.jsx)
 * ============================================================================
 * Role: Reusable Component (Vendor Portal)
 * Location: src/components/vendor/EventResourceRequirementsTable.jsx
 *
 * Purpose:
 *   Replicates legacy Event Review Resource Requirements table workflow:
 *     - Header with "+ Allocate Extra Resource" action trigger
 *     - Required vs. Available inventory stock comparison
 *     - Buffer calculations (+/- delta units)
 *     - Status badges: Safe, Risk, Critical
 *     - Action controls: Direct "▶ Allocate" button, "✓ Allocated", or "⚠ Conflict"
 * ============================================================================
 */

import React from "react";
import { Package, Plus } from "lucide-react";

function EventResourceRequirementsTable({
  requirements = [],
  onAllocate,
  onOpenExtraModal,
}) {
  return (
    <div className="client-req-card er-card-section" id="resourceReqSection">
      {/* ── Section Header with Title and Allocate Extra Button ── */}
      <div className="er-section-header">
        <h3 className="section-title">
          <Package size={16} className="er-title-icon er-title-icon--pink" />
          Resource Requirements
        </h3>

        <button
          type="button"
          className="btn-alloc-extra-res"
          onClick={onOpenExtraModal}
          title="Allocate an extra or alternative inventory resource"
        >
          <Plus size={14} /> Allocate Extra Resource
        </button>
      </div>

      {/* ── Table Wrapper ── */}
      <div className="req-wrap">
        <table className="req-table">
          <thead>
            <tr>
              <th>Resource Name</th>
              <th>Category</th>
              <th className="text-center">Required</th>
              <th className="text-center">Available</th>
              <th className="text-right">Buffer</th>
              <th className="text-right">Status</th>
              <th className="text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {requirements.length > 0 ? (
              requirements.map((res, index) => {
                const reqQty = Number(res.required || 0);
                const availQty = Number(res.available || 0);
                const buffer = availQty - reqQty;

                // Buffer styling class
                const bufferClass =
                  buffer > 0 ? "pos" : buffer === 0 ? "zero" : "neg";

                // Row status badge
                const statusBadge = res.isAllocated
                  ? "safe"
                  : buffer > 2
                  ? "safe"
                  : buffer >= 0
                  ? "risk"
                  : "critical";

                return (
                  <tr key={res.id || index}>
                    {/* Resource Name */}
                    <td>{res.name}</td>

                    {/* Category */}
                    <td>{res.category || "Equipment"}</td>

                    {/* Required Quantity */}
                    <td className="col-num">{reqQty}</td>

                    {/* Available in Stock */}
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
                      {res.isAllocated ? (
                        <span className="row-status safe">✓ Allocated</span>
                      ) : buffer < 0 ? (
                        <span className="row-status critical">⚠ Conflict</span>
                      ) : (
                        <button
                          type="button"
                          className="er-btn-action-allocate"
                          onClick={() => onAllocate && onAllocate(res)}
                          title={`Allocate ${res.name} to this event`}
                        >
                          ▶ Allocate
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="vendor-table-message text-center">
                  No resource requirements specified for this event.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default React.memo(EventResourceRequirementsTable);
