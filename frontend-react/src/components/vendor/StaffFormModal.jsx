/**
 * ============================================================================
 * VENDOR STAFF FORM MODAL COMPONENT (StaffFormModal.jsx)
 * ============================================================================
 * Role: Add / Edit Staff Modal Dialog (Vendor Staff Portal)
 * Location: src/components/vendor/StaffFormModal.jsx
 *
 * Parent / Invocation Context:
 *   - Called By: src/pages/vendor/ManageStaff.jsx
 *   - Parent Page: Vendor Manage Staff (src/pages/vendor/ManageStaff.jsx)
 *   - Where in Code: Rendered at the root layout of ManageStaff.jsx; displayed
 *     when `isOpen` is true.
 *
 * Purpose:
 *   Provides a validated modal dialog for creating or updating staff profiles:
 *     1. Captures full name, role, phone, email, initial workload, and availability status.
 *     2. Validates mandatory fields and email format before submission.
 *     3. Supports both adding a new team member and editing an existing one.
 *
 * Props:
 *   @param {boolean} props.isOpen - Whether modal is visible
 *   @param {string|null} props.editingStaffId - ID of item being edited (or null if adding)
 *   @param {Object} props.formData - Form values { name, role, phone, email, workload, status }
 *   @param {Object} props.formErrors - Validation error strings mapped by field key
 *   @param {Function} props.onChange - Handler called on form input edit (field, value)
 *   @param {Function} props.onSubmit - Handler called on form submission
 *   @param {Function} props.onClose - Handler to dismiss modal
 * ============================================================================
 */

import React from "react";
import { X } from "lucide-react";

function StaffFormModal({
  isOpen = false,
  editingStaffId = null,
  formData = {
    name: "",
    role: "",
    phone: "",
    email: "",
    workload: 0,
    status: "available",
  },
  formErrors = {},
  onChange,
  onSubmit,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div className="vendor-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="vendor-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div className="vendor-modal__header">
          <h3>{editingStaffId ? "Edit Staff" : "Add Staff"}</h3>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Modal Form ── */}
        <form onSubmit={onSubmit}>
          <div className="vendor-modal__body">
            <div className="form-grid-2col">
              {/* Field 1: Full Name */}
              <div className="form-group form-grid-full">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className={`form-input ${formErrors.name ? "form-input-error" : ""}`}
                  placeholder="e.g. Alex Johnson"
                  value={formData.name}
                  onChange={(e) => onChange("name", e.target.value)}
                />
                {formErrors.name && <span className="form-error-msg">{formErrors.name}</span>}
              </div>

              {/* Field 2: Role */}
              <div className="form-group">
                <label className="form-label">Role *</label>
                <input
                  type="text"
                  className={`form-input ${formErrors.role ? "form-input-error" : ""}`}
                  placeholder="e.g. Event Coordinator"
                  value={formData.role}
                  onChange={(e) => onChange("role", e.target.value)}
                />
                {formErrors.role && <span className="form-error-msg">{formErrors.role}</span>}
              </div>

              {/* Field 3: Phone */}
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="e.g. +1 555-0199"
                  value={formData.phone}
                  onChange={(e) => onChange("phone", e.target.value)}
                />
              </div>

              {/* Field 4: Email */}
              <div className="form-group form-grid-full">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  className={`form-input ${formErrors.email ? "form-input-error" : ""}`}
                  placeholder="name@eventpro.com"
                  value={formData.email}
                  onChange={(e) => onChange("email", e.target.value)}
                />
                {formErrors.email && <span className="form-error-msg">{formErrors.email}</span>}
              </div>

              {/* Field 5: Workload % */}
              <div className="form-group">
                <label className="form-label">Workload % * (0–100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className={`form-input ${formErrors.workload ? "form-input-error" : ""}`}
                  placeholder="e.g. 50"
                  value={formData.workload}
                  onChange={(e) => onChange("workload", e.target.value)}
                />
                {formErrors.workload && <span className="form-error-msg">{formErrors.workload}</span>}
              </div>

              {/* Field 6: Availability Status */}
              <div className="form-group">
                <label className="form-label">Availability Status</label>
                <select
                  className="form-input"
                  value={formData.status}
                  onChange={(e) => onChange("status", e.target.value)}
                >
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="off">Off Duty</option>
                </select>
              </div>
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
            <button type="submit" className="mr-add-btn">
              {editingStaffId ? "Update Staff" : "Save Staff"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default React.memo(StaffFormModal);
