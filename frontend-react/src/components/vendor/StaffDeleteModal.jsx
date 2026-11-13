/**
 * ============================================================================
 * VENDOR STAFF DELETE MODAL COMPONENT (StaffDeleteModal.jsx)
 * ============================================================================
 * Role: Deletion Confirmation Safeguard Dialog (Vendor Staff Portal)
 * Location: src/components/vendor/StaffDeleteModal.jsx
 *
 * Parent / Invocation Context:
 *   - Called By: src/pages/vendor/ManageStaff.jsx
 *   - Parent Page: Vendor Manage Staff (src/pages/vendor/ManageStaff.jsx)
 *   - Where in Code: Rendered at the root layout of ManageStaff.jsx; displayed
 *     when `isOpen` is true and `staff` is selected for removal.
 *
 * Purpose:
 *   Provides an explicit confirmation barrier before permanently deleting
 *   a staff team member from the vendor's roster.
 *
 * Props:
 *   @param {boolean} props.isOpen - Whether modal is visible
 *   @param {Object|null} props.staff - Target staff member record
 *   @param {Function} props.onConfirm - Callback executing deletion
 *   @param {Function} props.onClose - Callback dismissing modal
 * ============================================================================
 */

import React from "react";
import { X, AlertTriangle } from "lucide-react";

function StaffDeleteModal({
  isOpen = false,
  staff = null,
  onConfirm,
  onClose,
}) {
  if (!isOpen || !staff) return null;

  return (
    <div className="vendor-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="vendor-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div className="vendor-modal__header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertTriangle size={18} style={{ color: "var(--red, #ef4444)" }} />
            <h3>Remove Staff Member</h3>
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

        {/* ── Modal Warning Body ── */}
        <div className="vendor-modal__body">
          <p className="delete-modal-warning">
            Are you sure you want to remove{" "}
            <span className="delete-item-target">"{staff.name}"</span> ({staff.role})?
            This member will be unlinked from your team roster and unassigned from future events.
          </p>
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
            className="btn-delete-confirm"
            onClick={onConfirm}
          >
            Remove Staff
          </button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(StaffDeleteModal);
