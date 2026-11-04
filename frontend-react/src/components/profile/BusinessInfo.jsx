/**
 * ============================================================================
 * VENDOR BUSINESS INFORMATION COMPONENT (BusinessInfo.jsx)
 * ============================================================================
 * Role: Profile Subcomponent (Vendor & User Settings)
 * Location: src/components/profile/BusinessInfo.jsx
 *
 * Purpose:
 *   Renders the commercial identity and online presence section of the profile:
 *     1. Maps business attributes (Address, Years of Experience, LinkedIn URL, Website URL).
 *     2. In Read-Only Mode: Displays text, experience count, and clickable hyperlinks.
 *     3. In Edit Mode: Renders input controls with validation types (number, url, text).
 *
 * Props:
 *   @param {Object} props.formData - Current form values or user record
 *   @param {Function} props.handleChange - Change event dispatcher
 *   @param {boolean} props.editing - Whether active in edit mode vs read-only
 * ============================================================================
 */

import React from "react";

function BusinessInfo({ formData = {}, handleChange, editing = false }) {
  // --------------------------------------------------------------------------
  // 1. BUSINESS FIELDS SPECIFICATION
  // --------------------------------------------------------------------------
  const fields = [
    { label: "Address", name: "address", type: "text" },
    {
      label: "Years of Experience",
      name: "years_experience",
      type: "number",
    },
    { label: "LinkedIn URL", name: "linkedin_url", type: "url" },
    { label: "Website URL", name: "website_url", type: "url" },
  ];

  // --------------------------------------------------------------------------
  // 2. RENDER BUSINESS INFORMATION SECTION
  // --------------------------------------------------------------------------
  return (
    <section className="profile-section" aria-labelledby="business-info-heading">
      <h2 id="business-info-heading">Business Information</h2>

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
                min={field.type === "number" ? 0 : undefined}
                value={formData[field.name] ?? ""}
                onChange={handleChange}
              />
            ) : field.type === "url" && formData[field.name] ? (
              /* --- Read-Only Mode: Clickable Hyperlink for URLs --- */
              <a
                href={formData[field.name]}
                target="_blank"
                rel="noreferrer"
              >
                {formData[field.name]}
              </a>
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

export default BusinessInfo;