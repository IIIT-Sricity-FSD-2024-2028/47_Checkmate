/**
 * ============================================================================
 * RESOURCE FORM MODAL COMPONENT (ResourceFormModal.jsx)
 * ============================================================================
 * Role: Add / Edit Inventory Modal Dialog (Vendor Portal)
 * Location: src/components/vendor/ResourceFormModal.jsx
 *
 * Parent / Invocation Context:
 *   - Called By: src/pages/vendor/ManageResource.jsx
 *   - Parent Page: Vendor Manage Resources (src/pages/vendor/ManageResource.jsx)
 *   - Where in Code: Rendered at the root layout of ManageResource.jsx; displayed
 *     when `isOpen` is true.
 *
 * Purpose:
 *   Provides a validated modal form dialog allowing vendors to:
 *     1. Add a brand new equipment, furniture, or decor resource to inventory.
 *     2. Update the specifications, total quantity, rental price, or condition of an existing item.
 *
 * Props:
 *   @param {boolean} props.isOpen - Whether modal is visible
 *   @param {string|null} props.editingResourceId - ID of item being edited (or null if adding new)
 *   @param {Object} props.formData - Controlled form field state { name, category, quantity, price, available, condition }
 *   @param {Object} props.formErrors - Validation error strings mapped by field key
 *   @param {Function} props.onChange - Handler called when any form input changes (field, value)
 *   @param {Function} props.onSubmit - Handler called on form submission
 *   @param {Function} props.onClose - Handler to dismiss modal
 * ============================================================================
 */

import React from "react";
import { X } from "lucide-react";

function ResourceFormModal({
  isOpen = false,
  editingResourceId = null,
  formData = {
    name: "",
    category: "",
    quantity: "",
    price: "",
    available: "true",
    condition: "Ready",
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
          <h3>{editingResourceId ? "Edit Resource" : "Add Resource"}</h3>
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
              {/* Field 1: Resource Name */}
              <div className="form-group form-grid-full">
                <label className="form-label">Resource Name *</label>
                <input
                  type="text"
                  className={`form-input ${formErrors.name ? "form-input-error" : ""}`}
                  placeholder="e.g. Audio System Premium"
                  value={formData.name}
                  onChange={(e) => onChange("name", e.target.value)}
                />
                {formErrors.name && <span className="form-error-msg">{formErrors.name}</span>}
              </div>

              {/* Field 2: Category */}
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  className={`form-input ${formErrors.category ? "form-input-error" : ""}`}
                  value={formData.category}
                  onChange={(e) => onChange("category", e.target.value)}
                >
                  <option value="">Select category</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Decor">Decor</option>
                  <option value="General">General</option>
                </select>
                {formErrors.category && <span className="form-error-msg">{formErrors.category}</span>}
              </div>

              {/* Field 3: Quantity */}
              <div className="form-group">
                <label className="form-label">Total Quantity *</label>
                <input
                  type="number"
                  min="0"
                  className={`form-input ${formErrors.quantity ? "form-input-error" : ""}`}
                  placeholder="e.g. 12"
                  value={formData.quantity}
                  onChange={(e) => onChange("quantity", e.target.value)}
                />
                {formErrors.quantity && <span className="form-error-msg">{formErrors.quantity}</span>}
              </div>

              {/* Field 4: Rental Price */}
              <div className="form-group">
                <label className="form-label">Price (₹/day) *</label>
                <input
                  type="number"
                  min="0"
                  className={`form-input ${formErrors.price ? "form-input-error" : ""}`}
                  placeholder="e.g. 500"
                  value={formData.price}
                  onChange={(e) => onChange("price", e.target.value)}
                />
                {formErrors.price && <span className="form-error-msg">{formErrors.price}</span>}
              </div>

              {/* Field 5: Availability */}
              <div className="form-group">
                <label className="form-label">Availability Status</label>
                <select
                  className="form-input"
                  value={formData.available}
                  onChange={(e) => onChange("available", e.target.value)}
                >
                  <option value="true">Available</option>
                  <option value="false">Unavailable</option>
                </select>
              </div>

              {/* Field 6: Condition */}
              <div className="form-group form-grid-full">
                <label className="form-label">Equipment Condition</label>
                <select
                  className="form-input"
                  value={formData.condition}
                  onChange={(e) => onChange("condition", e.target.value)}
                >
                  <option value="Ready">Good / Ready</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
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
              {editingResourceId ? "Update Resource" : "Save Resource"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default React.memo(ResourceFormModal);
