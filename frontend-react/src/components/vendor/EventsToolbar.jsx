/**
 * ============================================================================
 * VENDOR EVENTS SEARCH & FILTER TOOLBAR (EventsToolbar.jsx)
 * ============================================================================
 * Role: Modular Search & Multi-Criteria Filtering Bar (Vendor Events Portal)
 * Location: src/components/vendor/EventsToolbar.jsx
 *
 * Purpose:
 *   Provides interactive filtering controls for the Event Requests catalog:
 *     1. Real-time search box matching event names, unique IDs, or venues.
 *     2. Status dropdown filter (Pending, Confirmed, Live, Completed, Rejected).
 *     3. Category/Type dropdown filter (Conference, Wedding, Corporate, Party).
 *     4. Results counter badge ("Showing X of Y events").
 *     5. One-click filter reset button when criteria are active.
 *
 * Props:
 *   @param {string} searchTerm - Current search keyword
 *   @param {Function} onSearchChange - Handler when search query updates
 *   @param {string} statusFilter - Current status filter value
 *   @param {Function} onStatusChange - Handler when status filter updates
 *   @param {string} typeFilter - Current type/category filter value
 *   @param {Function} onTypeChange - Handler when type filter updates
 *   @param {number} matchingCount - Count of matching events
 *   @param {number} totalCount - Total count of all loaded events
 *   @param {Function} onReset - Handler to reset all search/filter criteria
 * ============================================================================
 */

import React from "react";
import { Search, X, RotateCcw } from "lucide-react";

function EventsToolbar({
  searchTerm = "",
  onSearchChange,
  statusFilter = "All",
  onStatusChange,
  typeFilter = "All",
  onTypeChange,
  matchingCount = 0,
  totalCount = 0,
  onReset,
}) {
  const isFiltered = searchTerm.trim() !== "" || statusFilter !== "All" || typeFilter !== "All";

  return (
    <div className="vendor-toolbar events-toolbar">
      {/* ── Search Input Field with Clear Trigger ── */}
      <div className="vendor-search">
        <Search size={16} />
        <input
          type="text"
          placeholder="Search by event name, ID, venue, or client..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchTerm && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={() => onSearchChange("")}
            title="Clear search query"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* ── Filter Controls Group ── */}
      <div className="vendor-filter-group">
        {/* Status Dropdown Filter */}
        <select
          className="vendor-select"
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          aria-label="Filter events by status"
        >
          <option value="All">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="live">Live</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </select>

        {/* Category / Type Dropdown Filter */}
        <select
          className="vendor-select"
          value={typeFilter}
          onChange={(e) => onTypeChange(e.target.value)}
          aria-label="Filter events by type"
        >
          <option value="All">All Event Types</option>
          <option value="Conference">Conference</option>
          <option value="Wedding">Wedding</option>
          <option value="Corporate">Corporate</option>
          <option value="Party">Party</option>
          <option value="Exhibition">Exhibition</option>
        </select>

        {/* Results Counter Pill */}
        <span className="results-count-pill">
          {matchingCount} of {totalCount} events
        </span>

        {/* Reset Filters Button (Visible only when filters are active) */}
        {isFiltered && (
          <button
            type="button"
            className="filter-reset-pill-btn"
            onClick={onReset}
            title="Reset all search and filter criteria"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default EventsToolbar;
