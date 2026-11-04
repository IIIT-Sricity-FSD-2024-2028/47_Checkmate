/**
 * ============================================================================
 * CLIENT MY EVENTS (MyEvents.jsx)
 * ============================================================================
 * Role: Client Portal
 * Location: src/pages/client/MyEvents.jsx
 *
 * Purpose:
 *   Lists all event proposals and bookings created by the client:
 *     - Fetches from /api/events via getMyEvents()
 *     - Search & status filtering (All, Live, Pending, Approved, Completed, Rejected)
 *     - Status badges matching legacy design (with pulsing dot for Live events)
 *     - Direct navigation to Track Progress (/client/track/:id)
 *     - Modal to inspect rejection reasons if an event was declined
 * ============================================================================
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Search,
  PlusCircle,
  Eye,
  Activity,
  AlertTriangle,
  X,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

import '../../styles/client.css';
import { getMyEvents } from '../../services/eventService';

const TYPE_CLASSES = {
  Conference: 'badge--conference',
  Wedding: 'badge--wedding',
  Corporate: 'badge--corporate',
  Birthday: 'badge--birthday',
  Party: 'badge--birthday',
};

export default function ClientMyEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Rejection modal
  const [selectedRejectedEvent, setSelectedRejectedEvent] = useState(null);

  // Load client's events
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const myEvts = await getMyEvents();
        if (mounted) {
          setEvents(Array.isArray(myEvts) ? myEvts : []);
        }
      } catch (err) {
        console.error('Failed to load events:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    const interval = setInterval(loadData, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const st = String(ev.status || '').toLowerCase();
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'approved' && ['confirmed', 'approved'].includes(st)) ||
        st === statusFilter;

      if (!matchStatus) return false;

      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        String(ev.name || '').toLowerCase().includes(q) ||
        String(ev.id || '').toLowerCase().includes(q) ||
        String(ev.type || '').toLowerCase().includes(q) ||
        String(ev.venue || '').toLowerCase().includes(q) ||
        st.includes(q)
      );
    });
  }, [events, statusFilter, searchQuery]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const renderStatusBadge = (status) => {
    const s = String(status || 'pending').toLowerCase();
    if (s === 'live') {
      return (
        <span
          className="status-badge approved"
          style={{
            background: 'rgba(239,68,68,0.18)',
            color: '#fca5a5',
            border: '1px solid rgba(239,68,68,0.35)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            padding: '2px 8px',
          }}
        >
          <span className="live-dot-pulse" />
          LIVE
        </span>
      );
    }
    if (s === 'completed') {
      return (
        <span
          className="status-badge"
          style={{
            background: 'rgba(100,116,139,0.15)',
            color: '#94a3b8',
            border: '1px solid rgba(100,116,139,0.25)',
            fontSize: '11px',
            padding: '2px 8px',
          }}
        >
          Completed
        </span>
      );
    }
    if (s === 'confirmed' || s === 'approved') {
      return (
        <span className="status-badge approved" style={{ fontSize: '11px', padding: '2px 8px' }}>
          Approved
        </span>
      );
    }
    if (s === 'rejected') {
      return (
        <span className="status-badge rejected" style={{ fontSize: '11px', padding: '2px 8px' }}>
          Rejected
        </span>
      );
    }
    return (
      <span className="status-badge pending" style={{ fontSize: '11px', padding: '2px 8px' }}>
        Pending
      </span>
    );
  };

  return (
    <div className="client-content-wrap">
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            My Events
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            Inspect booking feasibility, live execution progress, and proposal updates.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate('/client/create-event')}
        >
          <PlusCircle size={15} style={{ marginRight: '6px' }} /> Create New Event
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card mb-6"
        style={{
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div className="search-box" style={{ flex: 1, minWidth: '240px' }}>
          <Search size={14} className="search-icon" />
          <input
            type="text"
            placeholder="Search by event name, ID, venue, or status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All' },
            { id: 'live', label: 'Live' },
            { id: 'pending', label: 'Pending' },
            { id: 'approved', label: 'Approved' },
            { id: 'completed', label: 'Completed' },
            { id: 'rejected', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`btn ${statusFilter === tab.id ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '6px 14px', fontSize: '12px' }}
              onClick={() => setStatusFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events Table Card */}
      <div className="card">
        <div className="er-table-wrap">
          <table className="er-table">
            <thead>
              <tr>
                <th style={{ width: '90px' }}>Event ID</th>
                <th>Event Name</th>
                <th>Type</th>
                <th>Date</th>
                <th>Venue</th>
                <th>Guests</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Loading your events...
                  </td>
                </tr>
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '48px 16px' }}>
                    <Calendar size={36} style={{ color: 'var(--text-muted)', marginBottom: '10px' }} />
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      No events found matching your filter criteria.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev) => {
                  const s = String(ev.status || '').toLowerCase();
                  return (
                    <tr key={ev.id} className="table-row">
                      <td className="col-id">{ev.id}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {ev.name}
                        </div>
                        {s === 'rejected' && ev.rejectionReason && (
                          <div
                            style={{
                              fontSize: '11px',
                              color: '#fca5a5',
                              marginTop: '3px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <AlertTriangle size={11} />
                            <span>
                              {ev.rejectionReason.length > 70
                                ? `${ev.rejectionReason.slice(0, 70)}…`
                                : ev.rejectionReason}
                            </span>
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${TYPE_CLASSES[ev.type] || 'badge--conference'}`}>
                          {ev.type || 'Event'}
                        </span>
                      </td>
                      <td>{formatDate(ev.date)}</td>
                      <td>{ev.venue || '—'}</td>
                      <td>{ev.people || ev.guests || '—'}</td>
                      <td>{renderStatusBadge(ev.status)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          {s === 'live' ? (
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => navigate(`/client/track/${ev.id}`)}
                              style={{
                                padding: '5px 12px',
                                fontSize: '12px',
                                background: 'rgba(239,68,68,0.25)',
                                borderColor: 'rgba(239,68,68,0.4)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <span className="live-dot-pulse" /> Track Live
                            </button>
                          ) : s === 'rejected' ? (
                            <button
                              type="button"
                              className="btn btn-ghost"
                              onClick={() => setSelectedRejectedEvent(ev)}
                              style={{
                                padding: '5px 12px',
                                fontSize: '12px',
                                color: '#fca5a5',
                                borderColor: 'rgba(239,68,68,0.3)',
                              }}
                            >
                              View Reason
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-ghost"
                              onClick={() => navigate(`/client/track/${ev.id}`)}
                              style={{ padding: '5px 12px', fontSize: '12px' }}
                            >
                              <Eye size={13} style={{ marginRight: '4px' }} /> Track
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: View Rejection Reason */}
      {selectedRejectedEvent && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target.classList.contains('modal-overlay')) setSelectedRejectedEvent(null);
          }}
        >
          <div
            className="card"
            style={{
              width: 'min(480px, 92vw)',
              background: 'var(--bg-card)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '16px',
              padding: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fca5a5' }}>
                <AlertTriangle size={20} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Declined Event Review
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRejectedEvent(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Event:</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {selectedRejectedEvent.name} ({selectedRejectedEvent.id})
              </div>
            </div>

            <div
              style={{
                background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '8px',
                padding: '14px',
                marginBottom: '20px',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#fca5a5', marginBottom: '6px' }}>
                Vendor Feedback:
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
                {selectedRejectedEvent.rejectionReason ||
                  'The vendor could not accept this event request due to scheduling or resource capacity constraints on the requested date.'}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedRejectedEvent(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setSelectedRejectedEvent(null);
                  navigate('/client/create-event');
                }}
              >
                Submit New Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
