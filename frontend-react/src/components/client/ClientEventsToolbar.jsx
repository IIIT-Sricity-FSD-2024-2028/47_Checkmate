/**
 * ============================================================================
 * CLIENT EVENTS SEARCH & FILTER TOOLBAR (ClientEventsToolbar.jsx)
 * ============================================================================
 * Role: Modular Search & Filter Bar (Client My Events page)
 * Location: src/components/client/ClientEventsToolbar.jsx
 *
 * Purpose:
 *   Same layout as the vendor <EventsToolbar>, with client statuses:
 *     1. Live search box (name, ID, type, status, venue) with a clear (X) button.
 *     2. Status dropdown (Pending, Approved, Live, Completed, Rejected).
 *     3. Event type dropdown (Wedding, Birthday, Conference, Party, Corporate).
 *     4. "X of Y events" counter and a Reset button when a filter is active.
 *
 * Props:
 *   @param {string} searchTerm / @param {Function} onSearchChange
 *   @param {string} statusFilter / @param {Function} onStatusChange
 *   @param {string} typeFilter / @param {Function} onTypeChange
 *   @param {number} matchingCount - Rows currently shown
 *   @param {number} totalCount - All rows loaded
 *   @param {Function} onReset - Clears every filter
 * ============================================================================
 */

import React from "react";
import { RotateCcw, Search, X } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "All", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "live", label: "Live" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
];
const TYPE_OPTIONS = ["Wedding", "Birthday", "Conference", "Party", "Corporate"];

function ClientEventsToolbar({
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
      {/* ── Search box with clear button ── */}
      <div className="vendor-search">
        <Search size={16} />
        <input
          type="text"
          placeholder="Search by Event ID, name or venue..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchTerm && (
          <button type="button" className="search-clear-btn" onClick={() => onSearchChange("")} title="Clear search">
            <X size={14} />
          </button>
        )}
      </div>

      {/* ── Filters + counter + reset ── */}
      <div className="vendor-filter-group">
        <select className="vendor-select" value={statusFilter} onChange={(e) => onStatusChange(e.target.value)}
          aria-label="Filter events by status">
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <select className="vendor-select" value={typeFilter} onChange={(e) => onTypeChange(e.target.value)}
          aria-label="Filter events by type">
          <option value="All">All Event Types</option>
          {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        <span className="results-count-pill">{matchingCount} of {totalCount} events</span>

        {isFiltered && (
          <button type="button" className="filter-reset-pill-btn" onClick={onReset} title="Reset all filters">
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default ClientEventsToolbar;
