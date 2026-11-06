/**
 * ============================================================================
 * VENDOR STAFF RECRUIT MODAL COMPONENT (StaffRecruitModal.jsx)
 * ============================================================================
 * Role: Hiring Requisition Dialog (Vendor Staff Portal)
 * Location: src/components/vendor/StaffRecruitModal.jsx
 *
 * Parent / Invocation Context:
 *   - Called By: src/pages/vendor/ManageStaff.jsx
 *   - Parent Page: Vendor Manage Staff (src/pages/vendor/ManageStaff.jsx)
 *   - Where in Code: Rendered at the root layout of ManageStaff.jsx; displayed
 *     when `isOpen` is true.
 *
 * Purpose:
 *   Submits an official recruitment request to the system administrator:
 *     1. Collects role position, work location, employment type, salary/rate, and description.
 *     2. Validates essential fields before dispatching the request.
 *     3. Registers a recruitment notification ticket for administrative review.
 *
 * Props:
 *   @param {boolean} props.isOpen - Whether modal is visible
 *   @param {Object} props.formData - Requisition fields { position, location, type, salary, description }
 *   @param {Object} props.errors - Field validation error messages
 *   @param {Function} props.onChange - Handler called on form field change
 *   @param {Function} props.onSubmit - Handler called on form submission
 *   @param {Function} props.onClose - Callback dismissing modal
 * ============================================================================
 */

import React from "react";
import { X, UserPlus } from "lucide-react";

function StaffRecruitModal({
  isOpen = false,
  formData = {
    position: "",
    location: "",
    type: "Full Time",
    salary: "",
    description: "",
  },
  errors = {},
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
        style={{ maxWidth: "500px" }}
      >
        {/* ── Modal Header ── */}
        <div className="vendor-modal__header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <UserPlus size={18} style={{ color: "var(--pink, #e91e8c)" }} />
            <h3>Request New Recruitment</h3>
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

        {/* ── Modal Form ── */}
        <form onSubmit={onSubmit}>
          <div className="vendor-modal__body">
            <div className="form-grid-2col">
              {/* Field 1: Position */}
              <div className="form-group form-grid-full">
                <label className="form-label">Position / Title *</label>
                <input
                  type="text"
                  className={`form-input ${errors.position ? "form-input-error" : ""}`}
                  placeholder="e.g. Senior Photographer, Audio Tech Lead"
                  value={formData.position}
                  onChange={(e) => onChange("position", e.target.value)}
                  autoFocus
                />
                {errors.position && <span className="form-error-msg">{errors.position}</span>}
              </div>

              {/* Field 2: Location */}
              <div className="form-group">
                <label className="form-label">Location *</label>
                <input
                  type="text"
                  className={`form-input ${errors.location ? "form-input-error" : ""}`}
                  placeholder="e.g. New York, NY"
                  value={formData.location}
                  onChange={(e) => onChange("location", e.target.value)}
                />
                {errors.location && <span className="form-error-msg">{errors.location}</span>}
              </div>

              {/* Field 3: Employment Type */}
              <div className="form-group">
                <label className="form-label">Employment Type</label>
                <select
                  className="form-input"
                  value={formData.type}
                  onChange={(e) => onChange("type", e.target.value)}
                >
                  <option value="Full Time">Full Time</option>
                  <option value="Part Time">Part Time</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>

              {/* Field 4: Salary / Rate */}
              <div className="form-group form-grid-full">
                <label className="form-label">Salary / Compensation Rate *</label>
                <input
                  type="text"
                  className={`form-input ${errors.salary ? "form-input-error" : ""}`}
                  placeholder="e.g. ₹45,000/mo or ₹500/hr"
                  value={formData.salary}
                  onChange={(e) => onChange("salary", e.target.value)}
                />
                {errors.salary && <span className="form-error-msg">{errors.salary}</span>}
              </div>

              {/* Field 5: Job Description */}
              <div className="form-group form-grid-full">
                <label className="form-label">Job Description</label>
                <textarea
                  rows="3"
                  className="form-input"
                  placeholder="Brief description of responsibilities and desired skills..."
                  value={formData.description}
                  onChange={(e) => onChange("description", e.target.value)}
                  style={{ resize: "vertical" }}
                />
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
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default React.memo(StaffRecruitModal);
