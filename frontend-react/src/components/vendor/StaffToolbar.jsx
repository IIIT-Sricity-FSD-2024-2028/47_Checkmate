/**
 * ============================================================================
 * VENDOR STAFF TOOLBAR COMPONENT (StaffToolbar.jsx)
 * ============================================================================
 * Role: Search, Filter & Action Toolbar (Vendor Staff Portal)
 * Location: src/components/vendor/StaffToolbar.jsx
 *
 * Parent / Invocation Context:
 *   - Called By: src/pages/vendor/ManageStaff.jsx
 *   - Parent Page: Vendor Manage Staff (src/pages/vendor/ManageStaff.jsx)
 *   - Where in Code: Positioned directly beneath <StaffStatsGrid> and above <StaffGrid>.
 *
 * Purpose:
 *   Provides interactive controls for managing the staff team:
 *     1. Real-time search by staff member name, role, or email.
 *     2. Dropdown filter panel with multi-attribute criteria (Role, Status, Workload).
 *     3. Recruitment request trigger to send a hiring requisition to Admin.
 *     4. "+ Add Staff" direct onboarding modal trigger.
 *
 * Props:
 *   @param {string} props.searchQuery - Current search text input
 *   @param {Function} props.onSearchChange - Handler triggered on search input change
 *   @param {Function} props.onClearSearch - Handler triggered to clear search input
 *   @param {Object} props.activeFilters - Currently applied filters { role, status, workload }
 *   @param {Function} props.onApplyFilters - Handler triggered to apply selected dropdown filters
 *   @param {Function} props.onResetFilters - Handler triggered to reset filters to defaults
 *   @param {Function} props.onOpenAddModal - Handler launching Add Staff modal dialog
 *   @param {Function} props.onOpenRecruitModal - Handler launching Recruitment Request dialog
 * ============================================================================
 */

import React, { useState, useEffect, useRef } from "react";
import { Search, SlidersHorizontal, Plus, UserPlus, X } from "lucide-react";

function StaffToolbar({
  searchQuery = "",
  onSearchChange,
  onClearSearch,
  activeFilters = { role: "All", status: "All", workload: "All" },
  onApplyFilters,
  onResetFilters,
  onOpenAddModal,
  onOpenRecruitModal,
}) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState(activeFilters);
  const filterDropdownRef = useRef(null);

  // Click-outside listener to close the filter dropdown cleanly
  useEffect(() => {
    function handleClickOutside(e) {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target)) {
        setIsFilterOpen(false);
      }
    }

    if (isFilterOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFilterOpen]);

  const handleToggleFilter = () => {
    if (!isFilterOpen) {
      setDraftFilters({ ...activeFilters });
    }
    setIsFilterOpen((prev) => !prev);
  };

  const handleApply = () => {
    onApplyFilters(draftFilters);
    setIsFilterOpen(false);
  };

  const handleReset = () => {
    const defaultFilters = { role: "All", status: "All", workload: "All" };
    setDraftFilters(defaultFilters);
    onResetFilters();
    setIsFilterOpen(false);
  };

  const hasActiveFilters =
    activeFilters.role !== "All" ||
    activeFilters.status !== "All" ||
    activeFilters.workload !== "All";

  return (
    <div className="ms-toolbar">
      {/* ── 1. Search Box with Instant Clear Button ── */}
      <div className="ms-search">
        <Search size={15} />
        <input
          type="text"
          className="ms-search-input"
          placeholder="Search staff by name, role, or email..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            className="ms-search-clear"
            onClick={onClearSearch}
            title="Clear search"
            aria-label="Clear search input"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* ── 2. More Filters Dropdown Panel ── */}
      <div className="ms-filter-wrapper" ref={filterDropdownRef}>
        <button
          type="button"
          className={`ms-filter-btn ${isFilterOpen || hasActiveFilters ? "active" : ""}`}
          onClick={handleToggleFilter}
          aria-expanded={isFilterOpen}
        >
          <SlidersHorizontal size={15} />
          <span>More Filters</span>
        </button>

        {isFilterOpen && (
          <div className="ms-filter-dropdown" role="region" aria-label="Staff Filters">
            {/* Filter 1: Role */}
            <div className="ms-filter-group">
              <label className="ms-filter-label">Role</label>
              <select
                className="ms-filter-select"
                value={draftFilters.role}
                onChange={(e) => setDraftFilters({ ...draftFilters, role: e.target.value })}
              >
                <option value="All">All Roles</option>
                <option value="Coordinator">Coordinator</option>
                <option value="Technician">Technician</option>
                <option value="Photographer">Photographer</option>
                <option value="Manager">Manager</option>
                <option value="Engineer">Engineer</option>
              </select>
            </div>

            {/* Filter 2: Status */}
            <div className="ms-filter-group">
              <label className="ms-filter-label">Status</label>
              <select
                className="ms-filter-select"
                value={draftFilters.status}
                onChange={(e) => setDraftFilters({ ...draftFilters, status: e.target.value })}
              >
                <option value="All">All Statuses</option>
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="off">Off Duty</option>
              </select>
            </div>

            {/* Filter 3: Workload */}
            <div className="ms-filter-group">
              <label className="ms-filter-label">Workload</label>
              <select
                className="ms-filter-select"
                value={draftFilters.workload}
                onChange={(e) => setDraftFilters({ ...draftFilters, workload: e.target.value })}
              >
                <option value="All">All Workloads</option>
                <option value="Low">Low (&lt; 50%)</option>
                <option value="Medium">Medium (50–79%)</option>
                <option value="High">High (80%+)</option>
              </select>
            </div>

            {/* Filter Actions */}
            <div className="ms-filter-actions">
              <button
                type="button"
                className="ms-filter-reset-btn"
                onClick={handleReset}
              >
                Reset
              </button>
              <button
                type="button"
                className="ms-filter-apply-btn"
                onClick={handleApply}
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 3. Request Recruitment Action Button ── */}
      <button
        type="button"
        className="ms-recruit-btn"
        onClick={onOpenRecruitModal}
        title="Send a recruitment request to system admin"
      >
        <UserPlus size={15} />
        <span>Request Recruitment</span>
      </button>

      {/* ── 4. Add Staff Modal Trigger Button ── */}
      <button
        type="button"
        className="ms-add-btn"
        onClick={onOpenAddModal}
      >
        <Plus size={15} />
        <span>Add Staff</span>
      </button>
    </div>
  );
}

export default React.memo(StaffToolbar);
