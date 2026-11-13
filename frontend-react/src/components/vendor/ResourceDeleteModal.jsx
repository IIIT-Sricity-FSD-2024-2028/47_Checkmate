/**
 * ============================================================================
 * RESOURCE DELETE MODAL COMPONENT (ResourceDeleteModal.jsx)
 * ============================================================================
 * Role: Deletion Confirmation Safeguard Dialog (Vendor Portal)
 * Location: src/components/vendor/ResourceDeleteModal.jsx
 *
 * Parent / Invocation Context:
 *   - Called By: src/pages/vendor/ManageResource.jsx
 *   - Parent Page: Vendor Manage Resources (src/pages/vendor/ManageResource.jsx)
 *   - Where in Code: Rendered at the root layout of ManageResource.jsx; displayed
 *     when `isOpen` is true and `resource` is selected.
 *
 * Purpose:
 *   Provides an explicit confirmation barrier before permanently deleting
 *   an inventory item from the vendor's catalog.
 *
 * Props:
 *   @param {boolean} props.isOpen - Whether modal is visible
 *   @param {Object|null} props.resource - The resource targeted for removal
 *   @param {Function} props.onConfirm - Callback executing deletion
 *   @param {Function} props.onClose - Callback dismissing modal
 * ============================================================================
 */

import React from "react";
import { X } from "lucide-react";

function ResourceDeleteModal({
  isOpen = false,
  resource = null,
  onConfirm,
  onClose,
}) {
  if (!isOpen || !resource) return null;

  return (
    <div className="vendor-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="vendor-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div className="vendor-modal__header">
          <h3>Delete Resource</h3>
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
            Are you sure you want to permanently delete{" "}
            <span className="delete-item-target">"{resource.name}"</span>?
            This item will be removed from your active equipment inventory.
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
            Delete Resource
          </button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(ResourceDeleteModal);
