import React, { useState, useEffect, useMemo } from 'react';
import { 
  PieChart, IndianRupee, Calendar, Package, Download, 
  Filter, TrendingUp, CheckCircle, Clock, AlertTriangle, RefreshCcw
} from 'lucide-react';
import { getEvents } from '../../services/eventService';
import { getBookings } from '../../services/bookingService';
import { getResources } from '../../services/resourceService';
import '../../styles/admin.css';

export default function ReportsAnalytics() {
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [evts, bks, res] = await Promise.all([
        getEvents().catch(() => []),
        getBookings().catch(() => []),
        getResources().catch(() => []),
      ]);
      setEvents(Array.isArray(evts) ? evts : []);
      setBookings(Array.isArray(bks) ? bks : []);
      setResources(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Failed to load reports data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered dataset
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      let matchesCat = true;
      if (categoryFilter !== 'all') {
        matchesCat = (ev.type || '').toLowerCase() === categoryFilter.toLowerCase();
      }
      return matchesCat;
    });
  }, [events, categoryFilter]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalEvents = filteredEvents.length;
    const completedEvents = filteredEvents.filter(
      (e) => (e.status || '').toLowerCase() === 'completed'
    ).length;

    const totalRevenue = filteredEvents.reduce(
      (acc, ev) => acc + (Number(ev.budget) || 0),
      0
    );

    const activeResources = resources.length;

    // Status breakdown
    const statusCounts = {
      pending: 0,
      approved: 0,
      completed: 0,
      other: 0,
    };

    filteredEvents.forEach((ev) => {
      const s = (ev.status || '').toLowerCase();
      if (s === 'pending') statusCounts.pending++;
      else if (s === 'approved' || s.includes('assigned') || s.includes('allocated')) statusCounts.approved++;
      else if (s === 'completed') statusCounts.completed++;
      else statusCounts.other++;
    });

    // Categories breakdown
    const catMap = {};
    filteredEvents.forEach((ev) => {
      const cat = ev.type || 'General';
      catMap[cat] = (catMap[cat] || 0) + (Number(ev.budget) || 1000);
    });

    return {
      totalEvents,
      completedEvents,
      totalRevenue,
      activeResources,
      statusCounts,
      catMap,
    };
  }, [filteredEvents, resources]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredEvents.length === 0) {
      alert('No event data to export.');
      return;
    }

    const headers = ['ID', 'Name', 'Type', 'Client', 'Date', 'Venue', 'Budget', 'Status'];
    const rows = filteredEvents.map((ev) => [
      ev.id || '',
      `"${(ev.name || '').replace(/"/g, '""')}"`,
      ev.type || 'Corporate',
      `"${(ev.client || ev.createdBy || '').replace(/"/g, '""')}"`,
      ev.date || '',
      `"${(ev.venue || '').replace(/"/g, '""')}"`,
      ev.budget || 0,
      ev.status || 'pending',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `checkmate_analytics_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="admin-page-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#fff', margin: 0 }}>Reports & Analytics</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Comprehensive performance metrics, revenue trajectories, and operational KPIs.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleExportCSV}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              background: 'rgba(0, 230, 118, 0.15)',
              border: '1px solid rgba(0, 230, 118, 0.3)',
              borderRadius: '8px',
              color: '#00e676',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            <Download size={14} /> Export CSV
          </button>

          <button
            onClick={fetchData}
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
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total Events Managed</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Calendar size={18} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '700', color: '#fff', marginTop: '10px' }}>
            {metrics.totalEvents}
          </div>
          <div style={{ fontSize: '11.5px', color: '#3b82f6', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={12} /> Active pipeline
          </div>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Completed Events</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(0, 230, 118, 0.1)', color: '#00e676' }}>
              <CheckCircle size={18} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '700', color: '#00e676', marginTop: '10px' }}>
            {metrics.completedEvents}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            100% fulfillment rate
          </div>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total GMV / Budget</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}>
              <IndianRupee size={18} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '700', color: '#fff', marginTop: '10px' }}>
            ₹{metrics.totalRevenue.toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: '11.5px', color: '#ec4899', marginTop: '4px' }}>
            Gross Platform Value
          </div>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Catalog Resources</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
              <Package size={18} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '700', color: '#fff', marginTop: '10px' }}>
            {metrics.activeResources}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Active verified inventory
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Status Breakdown Card */}
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', margin: 0 }}>
              Event Status Distribution
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{metrics.totalEvents} Total</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: '#fff' }}>Approved / In-Progress</span>
                <span style={{ color: '#3b82f6', fontWeight: '600' }}>{metrics.statusCounts.approved}</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${metrics.totalEvents ? (metrics.statusCounts.approved / metrics.totalEvents) * 100 : 0}%`, background: '#3b82f6' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: '#fff' }}>Pending Review</span>
                <span style={{ color: '#f59e0b', fontWeight: '600' }}>{metrics.statusCounts.pending}</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${metrics.totalEvents ? (metrics.statusCounts.pending / metrics.totalEvents) * 100 : 0}%`, background: '#f59e0b' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: '#fff' }}>Completed</span>
                <span style={{ color: '#00e676', fontWeight: '600' }}>{metrics.statusCounts.completed}</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${metrics.totalEvents ? (metrics.statusCounts.completed / metrics.totalEvents) * 100 : 0}%`, background: '#00e676' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: '#fff' }}>Other / Cancelled</span>
                <span style={{ color: '#ef4444', fontWeight: '600' }}>{metrics.statusCounts.other}</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${metrics.totalEvents ? (metrics.statusCounts.other / metrics.totalEvents) * 100 : 0}%`, background: '#ef4444' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Revenue by Category Card */}
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', margin: 0 }}>
              Revenue by Category
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>GMV Share</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {Object.entries(metrics.catMap).map(([category, amount], idx) => {
              const colors = ['#ec4899', '#8b5cf6', '#3b82f6', '#00e676', '#f59e0b'];
              const color = colors[idx % colors.length];
              const pct = metrics.totalRevenue ? Math.round((amount / metrics.totalRevenue) * 100) : 0;

              return (
                <div key={category}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ color: '#fff' }}>{category}</span>
                    <span style={{ color: color, fontWeight: '600' }}>₹{amount.toLocaleString("en-IN")} ({pct}%)</span>
                  </div>
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter and Table View */}
      <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', margin: 0 }}>
            Event Revenue Ledger
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={15} style={{ color: 'var(--text-muted)' }} />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: '7px 12px',
                background: '#161922',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12.5px',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Categories</option>
              <option value="Corporate">Corporate</option>
              <option value="Conference">Conference</option>
              <option value="Wedding">Wedding</option>
              <option value="Gala">Gala</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px', fontWeight: '600' }}>Event ID</th>
                <th style={{ padding: '12px', fontWeight: '600' }}>Title</th>
                <th style={{ padding: '12px', fontWeight: '600' }}>Type</th>
                <th style={{ padding: '12px', fontWeight: '600' }}>Client</th>
                <th style={{ padding: '12px', fontWeight: '600' }}>Date</th>
                <th style={{ padding: '12px', fontWeight: '600', textAlign: 'right' }}>Budget</th>
                <th style={{ padding: '12px', fontWeight: '600', textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((ev) => (
                <tr key={ev.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px', fontWeight: '600', color: '#fff' }}>{ev.id}</td>
                  <td style={{ padding: '12px', color: '#fff' }}>{ev.name}</td>
                  <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{ev.type || 'Corporate'}</td>
                  <td style={{ padding: '12px', color: '#fff' }}>{ev.client || ev.createdBy || 'Client'}</td>
                  <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{ev.date}</td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#00e676', fontWeight: '600' }}>
                    ₹{Number(ev.budget || 0).toLocaleString("en-IN")}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11.5px', background: 'rgba(255,255,255,0.06)', color: '#fff' }}>
                      {ev.status || 'pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

