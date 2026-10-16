/**
 * ============================================================================
 * RESOURCE TABLE ROW COMPONENT (ResourceTableRow.jsx)
 * ============================================================================
 * Role: Reusable Table Component (Vendor Portal)
 * Purpose:
 *   Renders a single row representing an inventory resource item in the
 *   Manage Resource table.
 *
 * Capabilities:
 *   - Formats resource name, category pill badge, and pricing ($/day).
 *   - Displays effective available stock vs total capacity with contextual
 *     color-coding (Green = In Stock, Yellow = Low Stock, Red = Depleted).
 *   - Renders live availability pill badge ("available" vs "unavailable").
 *   - Provides action triggers for Allocate (Phase-based assignment),
 *     Edit (modal form), and Delete (confirmation).
 *
 * Props:
 *   @param {Object} props.resource - The inventory resource data object
 *   @param {number} props.effectiveAvail - Available units after accounting for active event allocations
 *   @param {Function} props.onAllocate - Callback triggered when clicking the Allocate button
 *   @param {Function} props.onEdit - Callback triggered when clicking the Edit button
 *   @param {Function} props.onDelete - Callback triggered when clicking the Delete button
 * ============================================================================
 */

import React from "react";
import { Send, Pencil, Trash2 } from "lucide-react";

function ResourceTableRow({ resource, effectiveAvail, onAllocate, onEdit, onDelete }) {
  // --------------------------------------------------------------------------
  // 1. DATA EXTRACTION & DEFAULTS
  // --------------------------------------------------------------------------
  // Extract resource properties with safe fallbacks
  const {
    id,
    name = "Unnamed Resource",
    category = "General",
    total,
    quantity = 0,
    price = 0,
    unit = "day",
    available = true,
  } = resource;

  // Total inventory stock registered in the system
  const totalStock = total ?? quantity;

  // Safe numeric available count (defaults to total stock if effective availability is not calculated)
  const currentAvailable = typeof effectiveAvail === "number" ? effectiveAvail : totalStock;

  // Determine if the item can currently be allocated:
  // Must have available stock > 0 AND not be explicitly flagged unavailable
  const canAllocate = currentAvailable > 0 && available !== false;

  // Format availability text label
  const availStatus = available === false ? "unavailable" : currentAvailable > 0 ? "available" : "unavailable";

  // --------------------------------------------------------------------------
  // 2. CATEGORY PILL BADGE HELPER
  // --------------------------------------------------------------------------
  // Map category names to distinct CSS pill classes
  const getCategoryClass = (catStr) => {
    const normalized = String(catStr || "").toLowerCase().trim();
    if (normalized.includes("equip")) return "badge--equipment";
    if (normalized.includes("furn")) return "badge--furniture";
    if (normalized.includes("decor")) return "badge--decor";
    return "badge--general";
  };

  // --------------------------------------------------------------------------
  // 3. STOCK COUNT COLOR-CODING HELPER
  // --------------------------------------------------------------------------
  // Pick high-contrast text color based on stock health
  const getStockColorClass = () => {
    if (currentAvailable <= 0) return "col-res-stock-out";
    if (currentAvailable <= 10) return "col-res-stock-low";
    return "col-res-stock-avail";
  };

  return (
    <tr data-resource-id={id}>
      {/* ── Column 1: Resource Name ── */}
      <td className="col-res-name">
        {name}
      </td>

      {/* ── Column 2: Category Pill Badge ── */}
      <td>
        <span className={getCategoryClass(category)}>
          {category}
        </span>
      </td>

      {/* ── Column 3: Quantity / Stock Levels (Available / Total) ── */}
      <td className="col-res-stock">
        <span className={getStockColorClass()}>
          {currentAvailable}
        </span>
        {" / "}
        <span>{totalStock}</span>
      </td>

      {/* ── Column 4: Rental Unit Price ── */}
      <td>
        ${Number(price).toLocaleString()}/{unit}
      </td>

      {/* ── Column 5: Availability Status Badge ── */}
      <td>
        <span className={`avail-badge ${availStatus}`}>
          {availStatus}
        </span>
      </td>

      {/* ── Column 6: Action Buttons (Allocate, Edit, Delete) ── */}
      <td>
        <div className="mr-actions">
          {/* Action 1: Allocate to Event (Opens 2-phase allocation modal) */}
          <button
            type="button"
            className="mr-action-btn allocate"
            title={canAllocate ? "Allocate to Event" : "Item is out of stock"}
            disabled={!canAllocate}
            onClick={() => onAllocate && onAllocate(resource, currentAvailable)}
          >
            <Send size={14} />
          </button>

          {/* Action 2: Edit Resource Details */}
          <button
            type="button"
            className="mr-action-btn edit"
            title="Edit Resource"
            onClick={() => onEdit && onEdit(resource)}
          >
            <Pencil size={14} />
          </button>

          {/* Action 3: Delete Resource with Confirmation */}
          <button
            type="button"
            className="mr-action-btn delete"
            title="Delete Resource"
            onClick={() => onDelete && onDelete(resource)}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default ResourceTableRow;
