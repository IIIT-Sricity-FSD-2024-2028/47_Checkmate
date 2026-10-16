/**
 * ============================================================================
 * MODULAR CLIENT MY EVENTS PAGE (MyEvents.jsx)
 * ============================================================================
 * Role: Client
 * Purpose:
 *   High-level parent page listing every event the client has requested
 *   (port of client_myevents.html):
 *     1. Connects to `useClientEventsData` for loading, polling and filtering.
 *     2. Assembles focused, reusable modular subcomponents:
 *         - <ClientTopbar>: Title, subtitle, "Create Event" button, bell.
 *         - <ClientEventsStatsGrid>: 4 KPI cards (Total, Pending, Approved, Live).
 *         - <ClientEventsToolbar>: Search box + status/type filters.
 *         - <ClientEventsTable>: Table of <ClientEventTableRow> rows.
 *         - <RejectionReasonModal>: Popup explaining a rejected event.
 *
 * Connected Backend Endpoints:
 *   - GET /events (via getMyEvents) -> events belonging to this client
 * ============================================================================
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";

// Stylesheets
import "../../styles/vendor.css";
import "../../styles/dashboard.css";
import "./client.css";

// Global & Shared Reusable UI Components
import ClientTopbar from "../../components/client/ClientTopbar";

// Custom Data Hook
import useClientEventsData from "../../components/client/useClientEventsData";

// Modular My Events Subcomponents
import ClientEventsStatsGrid from "../../components/client/ClientEventsStatsGrid";
import ClientEventsToolbar from "../../components/client/ClientEventsToolbar";
import ClientEventsTable from "../../components/client/ClientEventsTable";
import RejectionReasonModal from "../../components/client/RejectionReasonModal";

function MyEvents() {
  const {
    events,
    filteredEvents,
    loading,
    error,
    stats,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    handleResetFilters,
  } = useClientEventsData();

  // The rejected event whose reason popup is open (null = closed)
  const [reasonEvent, setReasonEvent] = useState(null);

  return (
    <div className="vendor-page">
      {/* ── Top Header with Create Event shortcut ── */}
      <ClientTopbar title="My Events" subtitle="View and manage all your events">
        <Link to="/client/create-event" className="cl-btn-pink"><Plus size={16} /> Create Event</Link>
      </ClientTopbar>

      <div className="vendor-content">
        {error && <div className="cl-client-error">{error}</div>}

        {/* ── Component 1: KPI Summary Cards ── */}
        <ClientEventsStatsGrid stats={stats} loading={loading} />

        {/* ── Component 2: Search & Filter Toolbar ── */}
        <ClientEventsToolbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
          matchingCount={filteredEvents.length}
          totalCount={events.length}
          onReset={handleResetFilters}
        />

        {/* ── Component 3: Events Table ── */}
        <ClientEventsTable
          events={filteredEvents}
          loading={loading}
          hasAnyEvents={events.length > 0}
          onViewReason={setReasonEvent}
        />

        {/* ── Component 4: Rejection Reason Popup ── */}
        <RejectionReasonModal event={reasonEvent} onClose={() => setReasonEvent(null)} />
      </div>
    </div>
  );
}

export default MyEvents;
