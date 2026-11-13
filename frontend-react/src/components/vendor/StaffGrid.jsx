/**
 * ============================================================================
 * VENDOR STAFF GRID COMPONENT (StaffGrid.jsx)
 * ============================================================================
 * Role: Responsive Staff Card Grid with Pagination (Vendor Staff Portal)
 * Location: src/components/vendor/StaffGrid.jsx
 *
 * Parent / Invocation Context:
 *   - Called By: src/pages/vendor/ManageStaff.jsx
 *   - Parent Page: Vendor Manage Staff (src/pages/vendor/ManageStaff.jsx)
 *   - Where in Code: Positioned directly below <StaffToolbar> and above modal dialogs.
 *
 * Purpose:
 *   Renders the grid of staff team members:
 *     1. Displays responsive 3-column / 2-column / 1-column card layout.
 *     2. Handles loading skeleton and empty state messages.
 *     3. Maps items to <StaffCard> components.
 *     4. Renders pagination navigation controls.
 *
 * Reusable Components Utilized:
 *   - <StaffCard>: Individual staff profile card.
 *
 * Props:
 *   @param {Array} props.staffList - Paginated array of staff objects
 *   @param {boolean} [props.loading=false] - Whether data is actively loading
 *   @param {number} props.totalFiltered - Total staff matching filter criteria
 *   @param {number} props.currentPage - Active pagination page number
 *   @param {number} props.totalPages - Total calculated pages
 *   @param {number} props.itemsPerPage - Page size limit (e.g., 6 or 9)
 *   @param {Function} props.onPageChange - Handler changing active page
 *   @param {Function} props.onAssign - Handler when clicking Assign on a card
 *   @param {Function} props.onSchedule - Handler when clicking Schedule on a card
 *   @param {Function} props.onEdit - Handler when clicking Edit on a card
 *   @param {Function} props.onDelete - Handler when clicking Delete on a card
 * ============================================================================
 */

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import StaffCard from "./StaffCard";

function StaffGrid({
  staffList = [],
  loading = false,
  totalFiltered = 0,
  currentPage = 1,
  totalPages = 1,
  itemsPerPage = 6,
  onPageChange,
  onAssign,
  onSchedule,
  onEdit,
  onDelete,
}) {
  return (
    <>
      {/* ── 1. Staff Cards Grid Container ── */}
      {loading ? (
        <div className="vendor-table-message" style={{ padding: "60px 20px" }}>
          Loading staff workforce roster...
        </div>
      ) : staffList.length > 0 ? (
        <div className="staff-grid">
          {staffList.map((staff, idx) => (
            <StaffCard
              key={staff.id || idx}
              staff={staff}
              index={idx}
              onAssign={onAssign}
              onSchedule={onSchedule}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <div className="vendor-table-message" style={{ padding: "60px 20px" }}>
          No staff members found matching the specified criteria.
        </div>
      )}

      {/* ── 2. Pagination Footer ── */}
      <div className="ms-footer">
        <span className="ms-showing">
          Showing {totalFiltered} Staff Member{totalFiltered !== 1 ? "s" : ""}
          {totalFiltered > itemsPerPage && ` (Page ${currentPage} of ${totalPages})`}
        </span>

        {totalPages > 1 && (
          <div className="ms-pagination">
            <button
              type="button"
              className="ms-page-btn"
              title="Previous Page"
              aria-label="Previous Page"
              disabled={currentPage === 1}
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            >
              <ChevronLeft size={14} />
            </button>

            <button
              type="button"
              className="ms-page-btn"
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

export default React.memo(StaffGrid);
