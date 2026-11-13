/**
 * ============================================================================
 * RESOURCE TABLE COMPONENT (ResourceTable.jsx)
 * ============================================================================
 * Role: Modular Inventory Table with Pagination (Vendor Inventory Portal)
 * Location: src/components/vendor/ResourceTable.jsx
 *
 * Parent / Invocation Context:
 *   - Called By: src/pages/vendor/ManageResource.jsx
 *   - Parent Page: Vendor Manage Resources (src/pages/vendor/ManageResource.jsx)
 *   - Where in Code: Positioned directly below <ResourceToolbar> and above modal dialogs.
 *
 * Purpose:
 *   Renders the tabular view of inventory resources:
 *     1. Displays column headers for Name, Category, Stock, Price, Availability, and Actions.
 *     2. Renders loading skeleton / state message while fetching.
 *     3. Renders empty-state message when search/filters yield zero results.
 *     4. Delegates each item row to the reusable <ResourceTableRow> component.
 *     5. Renders pagination controls and records counter.
 *
 * Reusable Components Utilized:
 *   - <ResourceTableRow>: Modular row rendering individual resource items.
 *
 * Props:
 *   @param {Array} props.resources - Paginated array of resource objects
 *   @param {boolean} [props.loading=false] - Whether data is actively loading
 *   @param {number} props.totalFiltered - Total number of resources matching filter criteria
 *   @param {number} props.currentPage - Active pagination page number (1-indexed)
 *   @param {number} props.totalPages - Total calculated pagination pages
 *   @param {number} props.itemsPerPage - Page size limit (e.g., 8)
 *   @param {Function} props.onPageChange - Handler for changing pagination page
 *   @param {Function} props.getEffectiveAvail - Helper returning available stock units
 *   @param {Function} props.onAllocate - Callback triggered when clicking Allocate on a row
 *   @param {Function} props.onEdit - Callback triggered when clicking Edit on a row
 *   @param {Function} props.onDelete - Callback triggered when clicking Delete on a row
 * ============================================================================
 */

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ResourceTableRow from "./ResourceTableRow";

function ResourceTable({
  resources = [],
  loading = false,
  totalFiltered = 0,
  currentPage = 1,
  totalPages = 1,
  itemsPerPage = 8,
  onPageChange,
  getEffectiveAvail,
  onAllocate,
  onEdit,
  onDelete,
}) {
  return (
    <>
      {/* ── 1. Inventory Data Table Wrapper ── */}
      <div className="mr-table-wrap">
        <table className="mr-table">
          <thead>
            <tr>
              <th>Resource Name</th>
              <th>Category</th>
              <th>Quantity (Avail / Total)</th>
              <th>Rental Price</th>
              <th>Availability</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="vendor-table-message">
                  Loading inventory catalog from server...
                </td>
              </tr>
            ) : resources.length > 0 ? (
              resources.map((resource) => (
                <ResourceTableRow
                  key={resource.id}
                  resource={resource}
                  effectiveAvail={getEffectiveAvail(resource.id)}
                  onAllocate={onAllocate}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            ) : (
              <tr>
                <td colSpan="6" className="vendor-table-message">
                  No resources found matching the criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── 2. Table Footer & Pagination Navigation ── */}
      <div className="mr-footer">
        <span className="mr-showing">
          Showing {totalFiltered} Resource{totalFiltered !== 1 ? "s" : ""}
          {totalFiltered > itemsPerPage && ` (Page ${currentPage} of ${totalPages})`}
        </span>

        {totalPages > 1 && (
          <div className="mr-pagination">
            {/* Previous Page Button */}
            <button
              type="button"
              className="mr-page-btn"
              title="Previous Page"
              aria-label="Previous Page"
              disabled={currentPage === 1}
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            >
              <ChevronLeft size={14} />
            </button>

            {/* Next Page Button */}
            <button
              type="button"
              className="mr-page-btn"
              title="Next Page"
              aria-label="Next Page"
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default React.memo(ResourceTable);
