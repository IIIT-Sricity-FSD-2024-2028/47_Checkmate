/**
 * ============================================================================
 * VENDOR PRESET PACKAGE FORM MODAL (PackageFormModal.jsx)
 * ============================================================================
 * Role: Add / Edit Package Modal Dialog (Vendor Packages Portal)
 * Location: src/components/vendor/PackageFormModal.jsx
 *
 * Purpose:
 *   Comprehensive modal dialog allowing vendors to create or update packages:
 *     1. Validated inputs for Name, Category, Price, Duration, Capacity, and Description.
 *     2. Interactive Resource Selector: Click-to-toggle inventory items from real vendor stock.
 *     3. Interactive Staff Selector: Click-to-toggle staff coordinators from the vendor roster.
 *     4. Real-time field validation with accessible error messaging.
 *
 * Props:
 *   @param {boolean} isOpen - Whether modal is visible
 *   @param {Object|null} initialData - Existing package data when editing, or null for new
 *   @param {Array<Object>} availableResources - Catalog inventory available to bundle
 *   @param {Array<Object>} availableStaff - Workforce roster available to assign
 *   @param {Function} onClose - Callback to close modal
 *   @param {Function} onSave - Callback receiving (formData, editingId)
 * ============================================================================
 */

import React, { useState, useEffect } from "react";
import { X, Check, Plus } from "lucide-react";
import "../../styles/vendor.css";

function PackageFormModal({
  isOpen = false,
  initialData = null,
  availableResources = [],
  availableStaff = [],
  onClose,
  onSave,
}) {
  // --------------------------------------------------------------------------
  // FORM STATE
  // --------------------------------------------------------------------------
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    duration: "",
    capacity: "",
    desc: "",
    resources: [],
    staff: [],
  });

  const [errors, setErrors] = useState({});

  // Sync initialData when opening in Edit mode
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        category: initialData.category || "Wedding",
        price: initialData.price || "",
        duration: initialData.duration || "",
        capacity: initialData.capacity || "",
        desc: initialData.desc || "",
        resources: Array.isArray(initialData.resources) ? [...initialData.resources] : [],
        staff: Array.isArray(initialData.staff) ? [...initialData.staff] : [],
      });
    } else {
      setFormData({
        name: "",
        category: "",
        price: "",
        duration: "",
        capacity: "100-300",
        desc: "",
        resources: [],
        staff: [],
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // --------------------------------------------------------------------------
  // INTERACTIVE RESOURCE & STAFF PICKER TOGGLES
  // --------------------------------------------------------------------------
  const toggleResource = (resName) => {
    setFormData((prev) => {
      const exists = prev.resources.some((r) => r.includes(resName) || resName.includes(r));
      return {
        ...prev,
        resources: exists
          ? prev.resources.filter((r) => !r.includes(resName) && !resName.includes(r))
          : [...prev.resources, resName],
      };
    });
  };

  const toggleStaff = (staffLabel) => {
    setFormData((prev) => {
      const exists = prev.staff.some((s) => s.includes(staffLabel) || staffLabel.includes(s));
      return {
        ...prev,
        staff: exists
          ? prev.staff.filter((s) => !s.includes(staffLabel) && !staffLabel.includes(s))
          : [...prev.staff, staffLabel],
      };
    });
  };

  // --------------------------------------------------------------------------
  // VALIDATION & SUBMIT HANDLER
  // --------------------------------------------------------------------------
  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Package name is required.";
    if (!formData.category) newErrors.category = "Category selection is required.";
    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = "Enter a valid positive price.";
    }
    if (!formData.duration || isNaN(Number(formData.duration)) || Number(formData.duration) < 1) {
      newErrors.duration = "Enter duration in hours (minimum 1).";
    }
    if (!formData.desc.trim()) newErrors.desc = "Description is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(
      {
        ...formData,
        price: Number(formData.price),
        duration: Number(formData.duration),
      },
      initialData?.id || null
    );
    onClose();
  };

  return (
    <div
      className="vendor-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="vendor-modal pkg-form-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div className="vendor-modal__header">
          <h3>{initialData ? "Edit Package" : "Add Preset Package"}</h3>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Modal Form Body ── */}
        <form onSubmit={handleSubmit}>
          <div className="vendor-modal__body">
            {/* Field: Package Name */}
            <div className="form-group form-grid-full">
              <label className="form-label">Package Name *</label>
              <input
                type="text"
                className={`form-input ${errors.name ? "form-input-error" : ""}`}
                placeholder="e.g. Royal Wedding Grand Package"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              {errors.name && <span className="form-error-msg">{errors.name}</span>}
            </div>

            {/* Grid Row: Category & Price */}
            <div className="form-grid-2col">
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  className={`form-input ${errors.category ? "form-input-error" : ""}`}
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="">Select category</option>
                  <option value="Wedding">Wedding</option>
                  <option value="Birthday">Birthday</option>
                  <option value="Conference">Conference</option>
                  <option value="Corporate">Corporate</option>
                </select>
                {errors.category && <span className="form-error-msg">{errors.category}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Price ($) *</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  className={`form-input ${errors.price ? "form-input-error" : ""}`}
                  placeholder="e.g. 4500"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
                {errors.price && <span className="form-error-msg">{errors.price}</span>}
              </div>
            </div>

            {/* Grid Row: Duration & Guest Capacity */}
            <div className="form-grid-2col">
              <div className="form-group">
                <label className="form-label">Duration (Hours) *</label>
                <input
                  type="number"
                  min="1"
                  className={`form-input ${errors.duration ? "form-input-error" : ""}`}
                  placeholder="e.g. 8"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                />
                {errors.duration && <span className="form-error-msg">{errors.duration}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Guest Capacity</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 100–300"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                />
              </div>
            </div>

            {/* Field: Description */}
            <div className="form-group form-grid-full">
              <label className="form-label">Package Description *</label>
              <textarea
                rows="3"
                className={`form-textarea ${errors.desc ? "form-input-error" : ""}`}
                placeholder="Describe key inclusions, atmosphere, and deliverables..."
                value={formData.desc}
                onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
              />
              {errors.desc && <span className="form-error-msg">{errors.desc}</span>}
            </div>

            {/* Field: Included Inventory Resources Picker */}
            <div className="form-group form-grid-full">
              <label className="form-label">
                Included Resources{" "}
                <span className="alloc-qty-hint">(click to bundle inventory items)</span>
              </label>
              <div className="picker-grid">
                {availableResources.length > 0 ? (
                  availableResources.map((res) => {
                    const isSelected = formData.resources.some(
                      (r) => r.includes(res.name) || res.name.includes(r)
                    );
                    return (
                      <button
                        key={res.id}
                        type="button"
                        className={`picker-pill ${
                          isSelected ? "picker-pill--res-selected" : "picker-pill--unselected"
                        }`}
                        onClick={() => toggleResource(res.name)}
                      >
                        {isSelected ? <Check size={12} /> : <Plus size={12} />}
                        <span>{res.name}</span>
                      </button>
                    );
                  })
                ) : (
                  <span className="alloc-qty-hint">No inventory items available to select.</span>
                )}
              </div>
            </div>

            {/* Field: Required Staff Roster Picker */}
            <div className="form-group form-grid-full">
              <label className="form-label">
                Required Staff Roster{" "}
                <span className="alloc-qty-hint">(click to assign coordinators)</span>
              </label>
              <div className="picker-grid">
                {availableStaff.length > 0 ? (
                  availableStaff.map((st) => {
                    const label = `${st.name} (${st.role || "Coordinator"})`;
                    const isSelected = formData.staff.some(
                      (s) => s.includes(st.name) || st.name.includes(s)
                    );
                    return (
                      <button
                        key={st.id}
                        type="button"
                        className={`picker-pill ${
                          isSelected ? "picker-pill--staff-selected" : "picker-pill--unselected"
                        }`}
                        onClick={() => toggleStaff(label)}
                      >
                        {isSelected ? <Check size={12} /> : <Plus size={12} />}
                        <span>{label}</span>
                      </button>
                    );
                  })
                ) : (
                  <span className="alloc-qty-hint">No staff members available to assign.</span>
                )}
              </div>
            </div>
          </div>

          {/* ── Modal Footer ── */}
          <div className="vendor-modal__footer">
            <button
              type="button"
              className="pp-modal-cancel-btn mr-btn-cancel vendor-btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="pp-modal-submit-btn mr-btn-submit btn btn-primary vendor-btn-primary"
            >
              {initialData ? "Save Changes" : "Publish Package"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PackageFormModal;
