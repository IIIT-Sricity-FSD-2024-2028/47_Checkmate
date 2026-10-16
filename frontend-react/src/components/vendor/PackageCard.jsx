/**
 * ============================================================================
 * VENDOR PRESET PACKAGE CARD (PackageCard.jsx)
 * ============================================================================
 * Role: Individual Package Presentation Card (Vendor Packages Portal)
 * Location: src/components/vendor/PackageCard.jsx
 *
 * Purpose:
 *   Renders a single turnkey event package card displaying:
 *     1. Contextual category banner with customized gradient and iconography.
 *     2. Package name, category badge, and approval status pill.
 *     3. Comprehensive description of package deliverables.
 *     4. Included resource inventory tag chips.
 *     5. Required staff roster tag chips.
 *     6. Pricing, duration, guest capacity, and Edit / Delete action triggers.
 *
 * Reusable Components Utilized:
 *   - <StatusBadge>: Standardized status indicator.
 *
 * Props:
 *   @param {Object} packageData - Package record object
 *   @param {Function} onEdit - Callback to edit the package
 *   @param {Function} onDelete - Callback to delete the package
 * ============================================================================
 */

import React from "react";
import { Pencil, Trash2 } from "lucide-react";
import StatusBadge from "./StatusBadge";

// Icon and gradient styling map per category
const CATEGORY_MAP = {
  Wedding: { emoji: "💍", modifier: "wedding" },
  Birthday: { emoji: "🎂", modifier: "birthday" },
  Conference: { emoji: "🎤", modifier: "conference" },
  Corporate: { emoji: "🏢", modifier: "corporate" },
};

function PackageCard({ packageData, onEdit, onDelete }) {
  const {
    name = "Untitled Package",
    category = "Corporate",
    price = 0,
    duration = 8,
    capacity = "100-300",
    desc = "",
    resources = [],
    staff = [],
    status = "approved",
  } = packageData;

  const catMeta = CATEGORY_MAP[category] || { emoji: "📦", modifier: "general" };

  // Limit visible resource tags to 3 with "+X more" overflow
  const visibleResources = resources.slice(0, 3);
  const resourceOverflow = resources.length - visibleResources.length;

  return (
    <article className="pkg-card" data-category={category}>
      {/* ── Category Image Header Banner ── */}
      <div className={`pkg-img-placeholder pkg-img-placeholder--${catMeta.modifier}`}>
        <span role="img" aria-label={category}>
          {catMeta.emoji}
        </span>
      </div>

      {/* ── Card Body ── */}
      <div className="pkg-body">
        {/* Title & Badges Header */}
        <div className="pkg-header-row">
          <div className="pkg-title">{name}</div>
          <div className="table-actions-cell">
            <StatusBadge status={status} />
          </div>
        </div>

        {/* Deliverables Description */}
        <p className="pkg-desc">{desc || "No description provided."}</p>

        {/* Included Resources Section */}
        <div>
          <div className="pkg-section-label">Included Resources</div>
          <div className="pkg-tags">
            {visibleResources.length > 0 ? (
              visibleResources.map((res, i) => (
                <span key={i} className="pkg-tag pkg-tag--res">
                  {res}
                </span>
              ))
            ) : (
              <span className="pkg-tag">None listed</span>
            )}
            {resourceOverflow > 0 && (
              <span className="pkg-tag pkg-tag--more">
                +{resourceOverflow} more
              </span>
            )}
          </div>
        </div>

        {/* Required Staff Section */}
        <div>
          <div className="pkg-section-label">Required Staff</div>
          <div className="pkg-tags">
            {staff.length > 0 ? (
              staff.map((st, i) => (
                <span key={i} className="pkg-tag pkg-tag--staff">
                  {st}
                </span>
              ))
            ) : (
              <span className="pkg-tag">None listed</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Card Footer: Pricing & Action Buttons ── */}
      <div className="pkg-footer">
        <div className="pkg-price">
          <span className="pkg-price__amount">
            ${Number(price).toLocaleString()}
          </span>
          <span className="pkg-price__duration">
            {duration} hrs · up to {capacity} guests
          </span>
        </div>

        <div className="pkg-actions">
          {/* Edit Package Trigger */}
          <button
            type="button"
            className="pkg-action-btn edit"
            title="Edit Package"
            onClick={() => onEdit(packageData)}
          >
            <Pencil size={15} />
          </button>

          {/* Delete Package Trigger */}
          <button
            type="button"
            className="pkg-action-btn delete"
            title="Delete Package"
            onClick={() => onDelete(packageData)}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </article>
  );
}

export default PackageCard;
