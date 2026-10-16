/**
 * ============================================================================
 * VENDOR PRESET PACKAGE DELETE MODAL (PackageDeleteModal.jsx)
 * ============================================================================
 * Role: Confirmation Dialog (Vendor Packages Portal)
 * Location: src/components/vendor/PackageDeleteModal.jsx
 *
 * Purpose:
 *   Provides an explicit confirmation barrier before permanently deleting
 *   an event preset package from the vendor's catalog.
 *
 * Props:
 *   @param {boolean} isOpen - Whether confirmation modal is displayed
 *   @param {Object|null} packageData - Package record targeted for removal
 *   @param {Function} onClose - Callback to dismiss modal
 *   @param {Function} onConfirm - Callback to execute deletion
 * ============================================================================
 */

import React from "react";
import { AlertTriangle, X } from "lucide-react";
import "../../styles/vendor.css";

function PackageDeleteModal({
  isOpen = false,
  packageData = null,
  onClose,
  onConfirm,
}) {
  if (!isOpen || !packageData) return null;

  return (
    <div
      className="vendor-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="vendor-modal mr-modal--sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div className="vendor-modal__header">
          <div className="mr-modal-title-group">
            <AlertTriangle className="mr-delete-icon" size={20} />
            <h3 className="mr-modal-title">Delete Preset Package</h3>
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

        {/* ── Modal Message Body ── */}
        <div className="vendor-modal__body">
          <p className="mr-delete-prompt">
            Are you sure you want to delete the package{" "}
            <strong>"{packageData.name}"</strong>?
          </p>
          <p className="mr-delete-warning">
            This will permanently remove the bundle from client marketplace discovery and cannot be undone.
          </p>
        </div>

        {/* ── Modal Footer Actions ── */}
        <div className="vendor-modal__footer">
          <button
            type="button"
            className="pp-modal-cancel-btn mr-btn-cancel vendor-btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="mr-btn-delete"
            onClick={() => {
              onConfirm(packageData.id);
              onClose();
            }}
          >
            Delete Package
          </button>
        </div>
      </div>
    </div>
  );
}

export default PackageDeleteModal;
