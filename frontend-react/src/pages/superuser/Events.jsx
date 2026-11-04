import React, { useState, useEffect, useMemo } from 'react';
import { 
  CalendarCheck, Clock, CheckCircle2, RefreshCcw, Eye, 
  Search, Filter, AlertCircle, X, Check, Ban
} from 'lucide-react';
import { getEvents, updateEventStatus } from '../../services/eventService';
import '../../styles/superuser.css';

export default function SuperuserEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await getEvents();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return events.filter((ev) => {
      const matchesSearch =
        !q ||
        (ev.id && ev.id.toLowerCase().includes(q)) ||
        (ev.name && ev.name.toLowerCase().includes(q)) ||
        (ev.client && ev.client.toLowerCase().includes(q)) ||
        (ev.venue && ev.venue.toLowerCase().includes(q));

      const s = (ev.status || '').toLowerCase();
      let matchesStatus = true;
      if (statusFilter !== 'all') {
        matchesStatus = s === statusFilter.toLowerCase();
      }

      return matchesSearch && matchesStatus;
    });
  }, [events, searchTerm, statusFilter]);

  const handleOverrideStatus = async (eventId, newStatus) => {
    if (!window.confirm(`Root Override: Force transition event ${eventId} to status '${newStatus}'?`)) return;
    try {
      setActionLoading(true);
      await updateEventStatus(eventId, newStatus);
      await fetchEvents();
      if (selectedEvent && selectedEvent.id === eventId) {
        setSelectedEvent((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error('Failed to override event:', err);
      alert('Failed to override event status.');
    } finally {
      setActionLoading(false);
    }
  };

  const renderBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'approved') return <span className="su-badge su-badge-green">Approved</span>;
    if (s === 'completed') return <span className="su-badge su-badge-teal">Completed</span>;
    if (s === 'pending') return <span className="su-badge su-badge-orange">Pending Review</span>;
    if (s === 'cancelled' || s === 'refunded') return <span className="su-badge su-badge-red">Cancelled</span>;
    return <span className="su-badge su-badge-blue">{status || 'In Progress'}</span>;
  };

  return (
    <div className="su-page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#fff', margin: 0 }}>Master Events Pipeline</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Root event monitoring with unconditional override and state rollback capabilities.
          </p>
        </div>

        <button
          onClick={fetchEvents}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '9px 14px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          <RefreshCcw size={14} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '300px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search event ID, title, client, or venue..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '9px 12px',
              background: '#161922',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {filteredEvents.length} events recorded
        </div>
      </div>

      {/* Events Table */}
      <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCcw size={28} className="spin" style={{ margin: '0 auto 12px auto', display: 'block' }} />
            Loading events...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No events match your criteria.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Event ID</th>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Name & Type</th>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Client</th>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Date</th>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Budget</th>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '14px 16px', fontWeight: '600', textAlign: 'right' }}>Master Controls</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((ev) => {
                const s = (ev.status || '').toLowerCase();
                const isCompleted = s === 'completed';
                const isCancelled = s === 'cancelled' || s === 'refunded';

                return (
                  <tr key={ev.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: '600', color: '#fff' }}>{ev.id}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ color: '#fff', fontWeight: '600' }}>{ev.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{ev.type || 'Corporate'} • {ev.venue || 'Venue'}</div>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#fff' }}>
                      {ev.client || ev.createdBy || 'Emily Carter'}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{ev.date}</td>
                    <td style={{ padding: '14px 16px', color: '#00e676', fontWeight: '600' }}>
                      ${Number(ev.budget || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 16px' }}>{renderBadge(ev.status)}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setSelectedEvent(ev)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 10px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            color: '#fff',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          <Eye size={13} /> View
                        </button>

                        <button
                          disabled={actionLoading || isCompleted}
                          onClick={() => handleOverrideStatus(ev.id, 'completed')}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 10px',
                            background: 'rgba(0, 230, 118, 0.15)',
                            border: '1px solid rgba(0, 230, 118, 0.3)',
                            borderRadius: '6px',
                            color: '#00e676',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: isCompleted ? 'not-allowed' : 'pointer',
                            opacity: isCompleted ? 0.5 : 1,
                          }}
                          title="Force Complete Event"
                        >
                          <Check size={13} /> Complete
                        </button>

                        <button
                          disabled={actionLoading || isCancelled}
                          onClick={() => handleOverrideStatus(ev.id, 'cancelled')}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 10px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '6px',
                            color: '#ef4444',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: isCancelled ? 'not-allowed' : 'pointer',
                            opacity: isCancelled ? 0.5 : 1,
                          }}
                          title="Force Cancel / Refund Event"
                        >
                          <Ban size={13} /> Void
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(5px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px'
          }}
          onClick={() => setSelectedEvent(null)}
        >
          <div
            style={{
              background: '#12141c', border: '1px solid var(--border)', borderRadius: '14px',
              width: '100%', maxWidth: '550px', padding: '24px', position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedEvent(null)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{selectedEvent.id}</span>
              {renderBadge(selectedEvent.status)}
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#fff', margin: '0 0 16px 0' }}>
              {selectedEvent.name}
            </h2>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Venue & Time</span>
                <span style={{ color: '#fff' }}>{selectedEvent.venue} ({selectedEvent.date})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Client</span>
                <span style={{ color: '#fff' }}>{selectedEvent.client || selectedEvent.createdBy}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Assigned Vendor</span>
                <span style={{ color: '#60a5fa' }}>{selectedEvent.vendor || 'Elite Events Co.'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setSelectedEvent(null)}
                style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '13px', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
