/**
 * ============================================================================
 * EVENT RESOURCE REQUIREMENTS TABLE COMPONENT (EventResourceRequirementsTable.jsx)
 * ============================================================================
 * Role: Reusable Component (Vendor Portal)
 * Location: src/components/vendor/EventResourceRequirementsTable.jsx
 *
 * Purpose:
 *   Renders the Resource Feasibility Inspection table:
 *     - Displays each requested inventory item along with its category.
 *     - Compares required quantity against active available stock.
 *     - Provides a clear visual badge: "In Stock" (green) or "Shortage" (red).
 *
 * Props:
 *   @param {Array} props.requirements - List of resource requirement objects:
 *     [{ id, name, category, required, available, isSufficient }]
 * ============================================================================
 */

import React from "react";
import { Package, Check, X } from "lucide-react";

function EventResourceRequirementsTable({ requirements = [] }) {
  return (
    <div className="client-req-card er-card-section">
      {/* ── Card Header with Icon & Title ── */}
      <div className="er-section-header">
        <h3 className="section-title">
          <Package size={16} className="er-title-icon er-title-icon--pink" />
          Required Resources Check
        </h3>
      </div>

      {/* ── Resources Table Wrapper ── */}
      <div className="mr-table-wrap">
        <table className="mr-table">
          <thead>
            <tr>
              <th>Resource Item</th>
              <th>Category</th>
              <th>Required Units</th>
              <th>Available in Stock</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {requirements.length > 0 ? (
              requirements.map((res, index) => (
                <tr key={res.id || index}>
                  {/* Resource Name */}
                  <td className="col-res-name">{res.name}</td>

                  {/* Category Badge */}
                  <td>
                    <span className="badge badge--conference">{res.category}</span>
                  </td>

                  {/* Required Units */}
                  <td>{res.required}</td>

                  {/* Available Stock */}
                  <td>{res.available}</td>

                  {/* Status Badge (In Stock vs Shortage) */}
                  <td>
                    {res.isSufficient ? (
                      <span className="avail-badge available">
                        <Check size={12} className="er-badge-icon" />
                        In Stock
                      </span>
                    ) : (
                      <span className="avail-badge unavailable">
                        <X size={12} className="er-badge-icon" />
                        Shortage ({res.required - res.available} needed)
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              /* Empty state if no specific resources were requested */
              <tr>
                <td colSpan="5" className="vendor-table-message">
                  No specific resources requested for this event.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default EventResourceRequirementsTable;
