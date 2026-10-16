/**
 * ============================================================================
 * VENDOR EVENTS DATA TABLE (EventsTable.jsx)
 * ============================================================================
 * Role: Modular Data Table Container (Vendor Events Portal)
 * Location: src/components/vendor/EventsTable.jsx
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
 * ============================================================================
 */

import React from "react";
import EventTableRow from "./EventTableRow";

function EventsTable({
  events = [],
  loading = false,
  onView,
  onApprove,
  onReject,
}) {
  return (
    <div className="vendor-table-wrap events-table-wrap">
      <table className="vendor-table events-table">
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
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="8" className="vendor-table-message">
                <div className="table-loading-spinner" />
                <span>Loading event requests from database...</span>
              </td>
            </tr>
          ) : events.length === 0 ? (
            <tr>
              <td colSpan="8" className="vendor-table-message">
                <span>No matching event requests found for the selected criteria.</span>
              </td>
            </tr>
          ) : (
            events.map((event) => (
              <EventTableRow
                key={event.id || Math.random()}
                event={event}
                onView={onView}
                onApprove={onApprove}
                onReject={onReject}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default EventsTable;
