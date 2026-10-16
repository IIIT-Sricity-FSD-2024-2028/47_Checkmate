/**
 * ============================================================================
 * VENDOR PRESET PACKAGES TOOLBAR & TABS (PackageToolbar.jsx)
 * ============================================================================
 * Role: Modular Search, Category Tabs & Filter Toolbar (Vendor Packages Portal)
 * Location: src/components/vendor/PackageToolbar.jsx
 *
 * Purpose:
 *   Provides the top control bar for Preset Packages:
 *     1. Title banner and primary "+ Add Package" action button.
 *     2. Interactive category tabs (All, Wedding, Birthday, Conference, Corporate).
 *     3. Keyword search input with clear trigger.
 *     4. Multi-criteria dropdowns (Price Range & Guest Capacity).
 *     5. Results counter and reset filters action.
 *
 * Props:
 *   @param {string} searchTerm - Current keyword query
 *   @param {Function} onSearchChange - Handler for search query
 *   @param {string} selectedCategory - Active category tab
 *   @param {Function} onCategoryChange - Handler for category tab
 *   @param {string} priceFilter - Current price filter value
 *   @param {Function} onPriceChange - Handler for price filter
 *   @param {string} capacityFilter - Current capacity filter value
 *   @param {Function} onCapacityChange - Handler for capacity filter
 *   @param {number} matchingCount - Count of matching packages
 *   @param {number} totalCount - Total count of packages
 *   @param {Function} onAdd - Handler to open Add Package modal
 *   @param {Function} onReset - Handler to reset all criteria
 * ============================================================================
 */

import React from "react";
import { Search, Plus, X, RotateCcw } from "lucide-react";

const CATEGORIES = ["All", "Wedding", "Birthday", "Conference", "Corporate"];

function PackageToolbar({
  searchTerm = "",
  onSearchChange,
  selectedCategory = "All",
  onCategoryChange,
  priceFilter = "All",
  onPriceChange,
  capacityFilter = "All",
  onCapacityChange,
  matchingCount = 0,
  totalCount = 0,
  onAdd,
  onReset,
}) {
  const isFiltered =
    searchTerm.trim() !== "" ||
    selectedCategory !== "All" ||
    priceFilter !== "All" ||
    capacityFilter !== "All";

  return (
    <div className="package-toolbar-wrapper">
      {/* ── Top Header Section: Title & Add Package Button ── */}
      <div className="vendor-header pp-header">
        <div className="vendor-header__left pp-header__left">
          <h2>Preset Event Packages</h2>
          <p>Create, customize, and manage turnkey service packages for clients</p>
        </div>
        <button
          type="button"
          className="pp-add-btn btn btn-primary vendor-btn-primary"
          onClick={onAdd}
        >
          <Plus size={16} />
          <span>Add Package</span>
        </button>
      </div>

      {/* ── Category Filter Tabs Bar ── */}
      <div className="pp-tabs" role="tablist" aria-label="Package category tabs">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            role="tab"
            aria-selected={selectedCategory === cat}
            className={`pp-tab ${selectedCategory === cat ? "active" : ""}`}
            onClick={() => onCategoryChange(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Search & Filter Controls Row ── */}
      <div className="vendor-toolbar">
        {/* Search Input Box */}
        <div className="vendor-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search packages by name, description, or category..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => onSearchChange("")}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Multi-Criteria Filters Group */}
        <div className="vendor-filter-group">
          {/* Price Range Select */}
          <select
            className="vendor-select"
            value={priceFilter}
            onChange={(e) => onPriceChange(e.target.value)}
            aria-label="Filter packages by price"
          >
            <option value="All">All Prices</option>
            <option value="Under2k">Under $2,000</option>
            <option value="2kTo5k">$2,000 – $5,000</option>
            <option value="Over5k">Over $5,000</option>
          </select>

          {/* Capacity Select */}
          <select
            className="vendor-select"
            value={capacityFilter}
            onChange={(e) => onCapacityChange(e.target.value)}
            aria-label="Filter packages by guest capacity"
          >
            <option value="All">All Capacities</option>
            <option value="Small">Small (&lt; 100 guests)</option>
            <option value="Medium">Medium (100–300 guests)</option>
            <option value="Large">Large (300+ guests)</option>
          </select>

          {/* Results Count Pill */}
          <span className="results-count-pill">
            {matchingCount} of {totalCount} packages
          </span>

          {/* Reset Filters Button */}
          {isFiltered && (
            <button
              type="button"
              className="filter-reset-pill-btn"
              onClick={onReset}
              title="Reset all filters"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default PackageToolbar;
