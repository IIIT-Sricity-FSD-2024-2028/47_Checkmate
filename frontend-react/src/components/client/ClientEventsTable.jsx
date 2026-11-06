/**
 * ============================================================================
 * CLIENT EVENTS DATA TABLE (ClientEventsTable.jsx)
 * ============================================================================
 * Role: Modular Data Table Container (Client My Events page)
 * Location: src/components/client/ClientEventsTable.jsx
 *
 * Purpose:
 *   Renders the "All Events" table:
 *     1. Column headers (ID, Name, Type, Date, Venue, Guests, Status, Actions).
 *     2. Loading row while data is fetched.
 *     3. Empty state with a "Create Event" button when there is nothing to show.
 *     4. One <ClientEventTableRow> per event.
 *
 * Props:
 *   @param {Array<Object>} events - Filtered events
 *   @param {boolean} loading - Loading indicator
 *   @param {boolean} hasAnyEvents - false = client never created an event
 *   @param {Function} onViewReason - Opens the rejection reason popup
 * ============================================================================
 */

import React from "react";
import { Link } from "react-router-dom";
import { Calendar, Plus } from "lucide-react";
import ClientEventTableRow from "./ClientEventTableRow";

function ClientEventsTable({ events = [], loading = false, hasAnyEvents = true, onViewReason }) {
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
                <span>Loading your events...</span>
              </td>
            </tr>
          ) : events.length === 0 ? (
            <tr>
              <td colSpan="8" className="vendor-table-message">
                <div className="cl-client-empty">
                  <Calendar size={42} />
                  <strong>{hasAnyEvents ? "No events match your filters" : "You haven't created any events yet"}</strong>
                  <p>Submit your first event request to get started tracking!</p>
                  <Link to="/client/create-event" className="cl-btn-pink"><Plus size={16} /> Create Event</Link>
                </div>
              </td>
            </tr>
          ) : (
            events.map((event) => (
              <ClientEventTableRow key={event.id} event={event} onViewReason={onViewReason} />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ClientEventsTable;
