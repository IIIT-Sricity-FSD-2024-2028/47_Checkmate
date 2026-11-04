import React, { useState, useEffect, useMemo } from 'react';
import { 
  CalendarCheck, Clock, CheckCircle2, RefreshCcw, Eye, 
  Search, Filter, AlertCircle, X, ChevronLeft, ChevronRight, User, DollarSign, MapPin, Users
} from 'lucide-react';
import { getEvents, updateEventStatus } from '../../services/eventService';
import '../../styles/admin.css';

export default function MonitorEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const rowsPerPage = 10;

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getEvents();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load events:', err);
      setError('Failed to fetch events from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Compute stat counts
  const stats = useMemo(() => {
    const counts = {
      pending: 0,
      staff: 0,
      resources: 0,
      completed: 0,
      approved: 0,
    };
    events.forEach((ev) => {
      const s = (ev.status || '').toLowerCase();
      if (s === 'pending') counts.pending++;
      else if (s === 'staff assigned' || s === 'staff_assigned') counts.staff++;
      else if (s === 'resources allocated' || s === 'resources_allocated') counts.resources++;
      else if (s === 'completed') counts.completed++;
      else if (s === 'approved') counts.approved++;
    });
    return counts;
  }, [events]);

  // Filtering
  const filteredEvents = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return events.filter((ev) => {
      const matchesSearch = 
        !q ||
        (ev.id && ev.id.toLowerCase().includes(q)) ||
        (ev.name && ev.name.toLowerCase().includes(q)) ||
        (ev.client && ev.client.toLowerCase().includes(q)) ||
        (ev.clientId && ev.clientId.toLowerCase().includes(q)) ||
        (ev.venue && ev.venue.toLowerCase().includes(q));

      const s = (ev.status || '').toLowerCase();
      let matchesStatus = true;
      if (statusFilter !== 'all') {
        matchesStatus = s === statusFilter.toLowerCase();
      }

      return matchesSearch && matchesStatus;
    });
  }, [events, searchTerm, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredEvents.length / rowsPerPage) || 1;
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredEvents.slice(start, start + rowsPerPage);
  }, [filteredEvents, currentPage]);

  const handleApprove = async (eventId) => {
    try {
      setActionLoading(true);
      await updateEventStatus(eventId, 'approved');
      await fetchEvents();
    } catch (err) {
      console.error('Failed to approve event:', err);
      alert('Failed to approve event.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefund = async (eventId) => {
    if (!window.confirm(`Are you sure you want to cancel and refund event ${eventId}?`)) return;
    try {
      setActionLoading(true);
      await updateEventStatus(eventId, 'cancelled');
      await fetchEvents();
    } catch (err) {
      console.error('Failed to refund event:', err);
      alert('Failed to process refund.');
    } finally {
      setActionLoading(false);
    }
  };

  const renderBadge = (status) => {
    const s = (status || '').toLowerCase();
    let badgeClass = 'status-badge';
    let style = { background: 'rgba(255, 255, 255, 0.1)', color: '#fff', fontWeight: 600 };

    if (s === 'pending') {
      style = { background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontWeight: 600 };
    } else if (s === 'staff assigned' || s === 'staff_assigned') {
      style = { background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', fontWeight: 600 };
    } else if (s === 'resources allocated' || s === 'resources_allocated') {
      style = { background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', fontWeight: 600 };
    } else if (s === 'completed') {
      style = { background: 'rgba(0, 230, 118, 0.15)', color: '#00e676', fontWeight: 600 };
    } else if (s === 'approved') {
      style = { background: 'rgba(255, 255, 255, 0.15)', color: '#fff', fontWeight: 600 };
    } else if (s === 'cancelled' || s === 'refunded') {
      style = { background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontWeight: 600 };
    }

    const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending';
    return (
      <span className={badgeClass} style={style}>
        {label}
      </span>
    );
  };

  return (
    <div className="admin-page-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#fff', margin: 0 }}>Monitor Events</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
          Real-time oversight of all corporate, private, and public bookings across the platform.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="stat-card" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
          <div className="stat-card__top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Pending Review</span>
            <div className="stat-icon stat-icon--orange" style={{ padding: '8px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <Clock size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ fontSize: '24px', fontWeight: '700', color: '#fff', marginTop: '10px' }}>
            {stats.pending}
          </div>
        </div>

        <div className="stat-card" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
          <div className="stat-card__top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Staff Assigned</span>
            <div className="stat-icon stat-icon--blue" style={{ padding: '8px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Users size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ fontSize: '24px', fontWeight: '700', color: '#fff', marginTop: '10px' }}>
            {stats.staff}
          </div>
        </div>

        <div className="stat-card" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
          <div className="stat-card__top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Resources Allocated</span>
            <div className="stat-icon stat-icon--purple" style={{ padding: '8px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
              <CalendarCheck size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ fontSize: '24px', fontWeight: '700', color: '#fff', marginTop: '10px' }}>
            {stats.resources}
          </div>
        </div>

        <div className="stat-card" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
          <div className="stat-card__top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Approved / Active</span>
            <div className="stat-icon stat-icon--green" style={{ padding: '8px', borderRadius: '8px', background: 'rgba(0, 230, 118, 0.1)', color: '#00e676' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ fontSize: '24px', fontWeight: '700', color: '#fff', marginTop: '10px' }}>
            {stats.approved}
          </div>
        </div>

        <div className="stat-card" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
          <div className="stat-card__top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Completed</span>
            <div className="stat-icon stat-icon--pink" style={{ padding: '8px', borderRadius: '8px', background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ fontSize: '24px', fontWeight: '700', color: '#fff', marginTop: '10px' }}>
            {stats.completed}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by event ID, name, client, or venue..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              style={{
                width: '100%',
                padding: '10px 12px 10px 36px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '13.5px',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={16} style={{ color: 'var(--text-muted)' }} />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
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
              <option value="staff assigned">Staff Assigned</option>
              <option value="resources allocated">Resources Allocated</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled / Refunded</option>
            </select>
          </div>
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

      {/* Events Table */}
      <div className="table-container" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCcw size={28} className="spin" style={{ margin: '0 auto 12px auto', display: 'block' }} />
            Loading events...
          </div>
        ) : error ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
            <AlertCircle size={28} style={{ margin: '0 auto 12px auto', display: 'block' }} />
            {error}
          </div>
        ) : paginatedEvents.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No events match your criteria.
          </div>
        ) : (
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Event ID</th>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Event Name</th>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Client</th>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Date</th>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '14px 16px', fontWeight: '600', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEvents.map((ev) => {
                const s = (ev.status || '').toLowerCase();
                const isPending = s === 'pending';
                const isApproved = s === 'approved';
                const isCancelled = s === 'cancelled' || s === 'refunded';

                return (
                  <tr key={ev.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.15s' }}>
                    <td style={{ padding: '14px 16px', fontWeight: '600', color: '#fff' }}>{ev.id}</td>
                    <td style={{ padding: '14px 16px', color: '#fff', fontWeight: '500' }}>{ev.name}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '500', color: '#fff' }}>{ev.client || ev.createdBy || 'Client'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{ev.clientId || 'U004'}</div>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{ev.date}</td>
                    <td style={{ padding: '14px 16px' }}>{renderBadge(ev.status)}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px', justifyContent: 'flex-end' }}>
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

                        {isPending && (
                          <button
                            disabled={actionLoading}
                            onClick={() => handleApprove(ev.id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 10px',
                              background: 'rgba(59, 130, 246, 0.15)',
                              border: '1px solid rgba(59, 130, 246, 0.4)',
                              borderRadius: '6px',
                              color: '#60a5fa',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                            }}
                          >
                            <CalendarCheck size={13} /> Approve
                          </button>
                        )}

                        {isApproved && (
                          <button
                            disabled={actionLoading}
                            onClick={() => handleRefund(ev.id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 10px',
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.4)',
                              borderRadius: '6px',
                              color: '#ef4444',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                            }}
                          >
                            <RefreshCcw size={13} /> Refund
                          </button>
                        )}

                        {isCancelled && (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '6px 8px' }}>
                            Refunded
                          </span>
                        )}

                        {!isPending && !isApproved && !isCancelled && (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '6px 8px' }}>
                            Managed
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.01)', borderTop: '1px solid var(--border)', fontSize: '12.5px', color: 'var(--text-muted)' }}>
          <div>
            Showing {filteredEvents.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filteredEvents.length)} of {filteredEvents.length} events
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px 8px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: currentPage <= 1 ? 'var(--text-muted)' : '#fff',
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
              }}
            >
              <ChevronLeft size={14} />
            </button>
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 4px', color: '#fff', fontWeight: '500' }}>
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px 8px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: currentPage >= totalPages ? 'var(--text-muted)' : '#fff',
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={() => setSelectedEvent(null)}
        >
          <div
            style={{
              background: '#12141c',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              width: '100%',
              maxWidth: '650px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedEvent(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#fff', margin: 0 }}>
                {selectedEvent.name}
              </h2>
              {renderBadge(selectedEvent.status)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <User size={12} /> Client
                </div>
                <div style={{ fontSize: '14px', color: '#fff', fontWeight: '600', marginTop: '4px' }}>
                  {selectedEvent.client || selectedEvent.createdBy || 'Client'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{selectedEvent.clientEmail || selectedEvent.clientId || 'U004'}</div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <DollarSign size={12} /> Budget / Price
                </div>
                <div style={{ fontSize: '16px', color: '#00e676', fontWeight: '700', marginTop: '4px' }}>
                  ${Number(selectedEvent.budget || 0).toLocaleString()}
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={12} /> Venue & Date
                </div>
                <div style={{ fontSize: '13px', color: '#fff', fontWeight: '500', marginTop: '4px' }}>
                  {selectedEvent.venue || 'TBD'}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{selectedEvent.date} {selectedEvent.time ? `@ ${selectedEvent.time}` : ''}</div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Users size={12} /> Guests
                </div>
                <div style={{ fontSize: '14px', color: '#fff', fontWeight: '600', marginTop: '4px' }}>
                  {selectedEvent.people || selectedEvent.guests || 0} attendees
                </div>
              </div>
            </div>

            {/* Involved Vendors */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Assigned Vendors
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedEvent.vendor ? (
                  <span style={{ padding: '4px 10px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '6px', fontSize: '12.5px', color: '#60a5fa' }}>
                    {selectedEvent.vendor}
                  </span>
                ) : Array.isArray(selectedEvent.vendors) && selectedEvent.vendors.length > 0 ? (
                  selectedEvent.vendors.map((v, i) => (
                    <span key={i} style={{ padding: '4px 10px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '6px', fontSize: '12.5px', color: '#60a5fa' }}>
                      {typeof v === 'string' ? v : v.name || v.vendor}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No vendor assigned yet</span>
                )}
              </div>
            </div>

            {/* Notes */}
            {selectedEvent.notes && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Notes & Special Instructions
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  {selectedEvent.notes}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setSelectedEvent(null)}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
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
