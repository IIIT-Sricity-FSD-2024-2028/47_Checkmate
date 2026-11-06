/**
 * ============================================================================
 * VENDOR EVENTS DATA TABLE (EventsTable.jsx)
 * ============================================================================
 * Role: Modular Data Table Container (Vendor Events Portal)
 * Location: src/components/vendor/EventsTable.jsx
 *
 * Parent / Invocation Context:
 *   - Called By: src/pages/vendor/Events.jsx (Lines 118–124)
 *   - Also Reused In: src/pages/client/MyEvents.jsx
 *   - Parent Page: Vendor Event Requests (src/pages/vendor/Events.jsx, Component 4)
 *   - Where in Code: Rendered directly below <EventsToolbar> to house the tabular
 *     records via <EventTableRow> iterations.
 *
 * Purpose:
 *   Renders the tabular view of vendor event requests:
 *     1. Displays semantic table headers with sort/action columns.
 *     2. Handles loading skeleton state while fetching backend records.
 *     3. Renders empty-state fallback when search/filters return zero results.
 *     4. Maps each event record to the modular child row component:
 *         - <EventTableRow>: Renders individual event cells and action buttons.
 *
 * Reusable Components Utilized:
 *   - <EventTableRow>: Reusable row renderer for each event record.
 *
 * Props:
 *   @param {Array<Object>} events - Array of filtered event records
 *   @param {boolean} loading - Loading indicator
 *   @param {Function} onView - Callback to navigate to the Event Review page
 *   @param {Function} onApprove - Callback to approve an event request
 *   @param {Function} onReject - Callback to decline an event request
 *   @param {Function} onDelete - Callback to permanently delete a rejected event
 * ============================================================================
 */

import React from "react";
import EventTableRow from "./EventTableRow";
import { findEventCollisions } from "../../services/eventService";

function EventsTable({
  events = [],
  allEvents = [],
  loading = false,
  onView,
  onApprove,
  onReject,
  onDelete,
}) {
  const comparisonPool = Array.isArray(allEvents) && allEvents.length > 0 ? allEvents : events;
  return (
    <div className="vendor-table-wrap events-table-wrap">
      <table className="vendor-table events-table">
        {/* ── 1. Table Column Header Structure ── */}
        <thead>
          <tr>
            <th>Event ID</th>
            <th>Event Name</th>
            <th>Type</th>
            <th>Date</th>
            <th>Venue</th>
            <th>Guests</th>
            <th>Status</th>
            <th className="table-actions-header">Actions</th>
          </tr>
        </thead>

        {/* ── 2. Table Body: Loading, Empty, or Data Rows ── */}
        <tbody>
          {/* State A: Loading spinner while fetching data from backend */}
          {loading ? (
            <tr>
              <td colSpan="8" className="vendor-table-message">
                <div className="table-loading-spinner" />
                <span>Loading event requests from database...</span>
              </td>
            </tr>
          /* State B: Empty state if no events match active search or filters */
          ) : events.length === 0 ? (
            <tr>
              <td colSpan="8" className="vendor-table-message">
                <span>No matching event requests found for the selected criteria.</span>
              </td>
            </tr>
          /* State C: Map filtered event records to individual <EventTableRow> components */
          ) : (
            events.map((event) => {
              const isPending = String(event.status || "").toLowerCase() === "pending";
              const collisions = isPending ? findEventCollisions(event, comparisonPool) : [];

              return (
                <EventTableRow
                  key={event.id || Math.random()}
                  event={event}
                  collisions={collisions}
                  onView={onView}
                  onApprove={onApprove}
                  onReject={onReject}
                  onDelete={onDelete}
                />
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default EventsTable;
