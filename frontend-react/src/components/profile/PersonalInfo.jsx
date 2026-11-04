/**
 * ============================================================================
 * VENDOR PERSONAL INFORMATION COMPONENT (PersonalInfo.jsx)
 * ============================================================================
 * Role: Profile Subcomponent (Vendor & User Settings)
 * Location: src/components/profile/PersonalInfo.jsx
 *
 * Purpose:
 *   Renders the personal identity and contact info section of the profile:
 *     1. Maps contact fields (Name, Email Address, Phone Number).
 *     2. In Read-Only Mode: Displays values in semantic text paragraphs.
 *     3. In Edit Mode: Renders controlled input elements with change handlers.
 *
 * Props:
 *   @param {Object} props.formData - Current form values or user record
 *   @param {Function} props.handleChange - Change event dispatcher
 *   @param {boolean} props.editing - Whether active in edit mode vs read-only
 * ============================================================================
 */

import React from "react";

function PersonalInfo({ formData = {}, handleChange, editing = false }) {
  // --------------------------------------------------------------------------
  // 1. FIELD SCHEMAS CONFIGURATION
  // --------------------------------------------------------------------------
  const fields = [
    { label: "Name", name: "name", type: "text" },
    { label: "Email Address", name: "email", type: "email" },
    { label: "Phone Number", name: "phone", type: "tel" },
  ];

  // --------------------------------------------------------------------------
  // 2. RENDER PERSONAL INFORMATION SECTION
  // --------------------------------------------------------------------------
  return (
    <section className="profile-section" aria-labelledby="personal-info-heading">
      <h2 id="personal-info-heading">Personal Information</h2>

      <div className="profile-info-grid">
        {fields.map((field) => (
          <div className="profile-field" key={field.name}>
            <label htmlFor={`field-${field.name}`}>{field.label}</label>

            {editing ? (
              /* --- Edit Mode: Controlled Input Field --- */
              <input
                id={`field-${field.name}`}
                name={field.name}
                type={field.type || "text"}
                value={formData[field.name] ?? ""}
                onChange={handleChange}
              />
            ) : (
              /* --- Read-Only Mode: Static Value Display --- */
              <p>{formData[field.name] || "NA"}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default PersonalInfo;