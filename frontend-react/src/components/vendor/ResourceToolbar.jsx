/**
 * ============================================================================
 * RESOURCE TOOLBAR COMPONENT (ResourceToolbar.jsx)
 * ============================================================================
 * Role: Search, Filter & Action Toolbar (Vendor Inventory Portal)
 * Location: src/components/vendor/ResourceToolbar.jsx
 *
 * Parent / Invocation Context:
 *   - Called By: src/pages/vendor/ManageResource.jsx
 *   - Parent Page: Vendor Manage Resources (src/pages/vendor/ManageResource.jsx)
 *   - Where in Code: Positioned directly below <ResourceStatsGrid> and above <ResourceTable>.
 *
 * Purpose:
 *   Provides interactive controls for managing the inventory catalog:
 *     1. Real-time search keyword input across resource names and categories.
 *     2. Dropdown filter panel with multi-attribute filtering (Category, Condition, Stock Level).
 *     3. "+ Add Resource" modal trigger button.
 *
 * Props:
 *   @param {string} props.searchQuery - Current search text input
 *   @param {Function} props.onSearchChange - Handler triggered on search input edit
 *   @param {Function} props.onClearSearch - Handler triggered when clearing the search input
 *   @param {Object} props.activeFilters - Currently applied filters { category, condition, stock }
 *   @param {Function} props.onApplyFilters - Handler triggered to apply selected dropdown filters
 *   @param {Function} props.onResetFilters - Handler triggered to reset filters to defaults
 *   @param {Function} props.onOpenAddModal - Handler triggered to launch Add Resource modal dialog
 * ============================================================================
 */

import React, { useState, useEffect, useRef } from "react";
import { Search, SlidersHorizontal, Plus, X } from "lucide-react";

function ResourceToolbar({
  searchQuery = "",
  onSearchChange,
  onClearSearch,
  activeFilters = { category: "All", condition: "All", stock: "All" },
  onApplyFilters,
  onResetFilters,
  onOpenAddModal,
}) {
  // Filter dropdown open/close state
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Draft filter selections configured within the dropdown before submission
  const [draftFilters, setDraftFilters] = useState(activeFilters);

  // Reference for click-outside detection
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

  // Handle toggling the dropdown
  const handleToggleFilter = () => {
    if (!isFilterOpen) {
      setDraftFilters({ ...activeFilters });
    }
    setIsFilterOpen((prev) => !prev);
  };

  // Handle applying filters
  const handleApply = () => {
    onApplyFilters(draftFilters);
    setIsFilterOpen(false);
  };

  // Handle resetting filters
  const handleReset = () => {
    const defaultFilters = { category: "All", condition: "All", stock: "All" };
    setDraftFilters(defaultFilters);
    onResetFilters();
    setIsFilterOpen(false);
  };

  // Check if any non-default filters are active
  const hasActiveFilters =
    activeFilters.category !== "All" ||
    activeFilters.condition !== "All" ||
    activeFilters.stock !== "All";

  return (
    <div className="mr-toolbar">
      {/* ── 1. Search Box with Instant Clear Button ── */}
      <div className="mr-search">
        <Search size={15} />
        <input
          type="text"
          className="mr-search-input"
          placeholder="Search resources by name or category..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            className="mr-search-clear"
            onClick={onClearSearch}
            title="Clear search"
            aria-label="Clear search input"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* ── 2. More Filters Dropdown Panel ── */}
      <div className="mr-filter-wrapper" ref={filterDropdownRef}>
        <button
          type="button"
          className={`mr-filter-btn ${isFilterOpen || hasActiveFilters ? "active" : ""}`}
          onClick={handleToggleFilter}
          aria-expanded={isFilterOpen}
        >
          <SlidersHorizontal size={15} />
          <span>More Filters</span>
        </button>

        {/* Dropdown Card */}
        {isFilterOpen && (
          <div className="mr-filter-dropdown" role="region" aria-label="Inventory Filters">
            {/* Filter 1: Category */}
            <div className="mr-filter-group">
              <label className="mr-filter-label">Category</label>
              <select
                className="mr-filter-select"
                value={draftFilters.category}
                onChange={(e) => setDraftFilters({ ...draftFilters, category: e.target.value })}
              >
                <option value="All">All Categories</option>
                <option value="Equipment">Equipment</option>
                <option value="Furniture">Furniture</option>
                <option value="Decor">Decor</option>
              </select>
            </div>

            {/* Filter 2: Condition */}
            <div className="mr-filter-group">
              <label className="mr-filter-label">Condition</label>
              <select
                className="mr-filter-select"
                value={draftFilters.condition}
                onChange={(e) => setDraftFilters({ ...draftFilters, condition: e.target.value })}
              >
                <option value="All">All Conditions</option>
                <option value="Ready">Good / Ready</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
              </select>
            </div>

            {/* Filter 3: Stock Level */}
            <div className="mr-filter-group">
              <label className="mr-filter-label">Stock Level</label>
              <select
                className="mr-filter-select"
                value={draftFilters.stock}
                onChange={(e) => setDraftFilters({ ...draftFilters, stock: e.target.value })}
              >
                <option value="All">All Levels</option>
                <option value="InStock">In Stock (&gt; 0)</option>
                <option value="LowStock">Low Stock (1–10)</option>
                <option value="OutStock">Out of Stock (0)</option>
              </select>
            </div>

            {/* Filter Actions: Reset & Apply */}
            <div className="mr-filter-actions">
              <button
                type="button"
                className="mr-filter-reset-btn"
                onClick={handleReset}
              >
                Reset
              </button>
              <button
                type="button"
                className="mr-filter-apply-btn"
                onClick={handleApply}
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 3. Add Resource Modal Trigger Button ── */}
      <button
        type="button"
        className="mr-add-btn"
        onClick={onOpenAddModal}
      >
        <Plus size={15} />
        <span>Add Resource</span>
      </button>
    </div>
  );
}

export default React.memo(ResourceToolbar);
