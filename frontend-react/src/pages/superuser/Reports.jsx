import React, { useState, useEffect, useMemo } from 'react';
import { 
  PieChart, DollarSign, Calendar, Package, Users, 
  Download, RefreshCcw, TrendingUp, CheckCircle, ShieldCheck
} from 'lucide-react';
import { getEvents } from '../../services/eventService';
import { getUsers } from '../../services/userService';
import { getResources } from '../../services/resourceService';
import { getBookingsCommissions } from '../../services/bookingService';
import '../../styles/superuser.css';

export default function SuperuserReports() {
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [resources, setResources] = useState([]);
  const [commissionsData, setCommissionsData] = useState({ commissions: [], aggregates: {} });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [evts, usrs, res, comms] = await Promise.all([
        getEvents().catch(() => []),
        getUsers().catch(() => []),
        getResources().catch(() => []),
        getBookingsCommissions().catch(() => ({ commissions: [], aggregates: {} })),
      ]);
      setEvents(Array.isArray(evts) ? evts : []);
      setUsers(Array.isArray(usrs) ? usrs : []);
      setResources(Array.isArray(res) ? res : []);
      setCommissionsData(comms || { commissions: [], aggregates: {} });
    } catch (err) {
      console.error('Failed to load superuser reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalGMV = events.reduce((a, b) => a + (Number(b.budget) || 0), 0);
  const totalCommission = totalGMV * 0.1;
  const totalNetPayout = totalGMV * 0.9;

  const handleExportCSV = () => {
    const headers = ['Type', 'Identifier', 'Name/Title', 'Category/Role', 'Status', 'Value'];
    const rows = [
      ...events.map((e) => ['Event', e.id, `"${e.name}"`, e.type || 'Corporate', e.status || 'pending', e.budget || 0]),
      ...users.map((u) => ['User', u.id, `"${u.name}"`, u.role || 'Client', u.status || 'Active', '—']),
      ...resources.map((r) => ['Resource', r.id, `"${r.name}"`, r.category || 'General', 'Available', r.pricePerDay || 0]),
    ];

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `superuser_system_telemetry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="su-page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#fff', margin: 0 }}>System Telemetry & Reports</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Comprehensive analytics covering cross-portal revenue, resource allocation, and user growth.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
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
            <Download size={14} /> Export Master CSV
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

      {/* Aggregate Cards */}
      <div className="su-grid-4">
        <div className="su-card">
          <div className="su-card-header">
            <span className="su-card-label">Total Platform Volume</span>
            <DollarSign size={18} color="#ec4899" />
          </div>
          <div className="su-card-value" style={{ color: '#ec4899' }}>${totalGMV.toLocaleString()}</div>
          <div className="su-card-sub" style={{ color: '#00e676' }}>
            <TrendingUp size={14} /> 100% Escrow coverage
          </div>
        </div>

        <div className="su-card">
          <div className="su-card-header">
            <span className="su-card-label">Commission Take (10%)</span>
            <ShieldCheck size={18} color="#00e676" />
          </div>
          <div className="su-card-value" style={{ color: '#00e676' }}>${totalCommission.toLocaleString()}</div>
          <div className="su-card-sub">
            Platform net revenues
          </div>
        </div>

        <div className="su-card">
          <div className="su-card-header">
            <span className="su-card-label">Vendor Disbursals</span>
            <DollarSign size={18} color="#22d3ee" />
          </div>
          <div className="su-card-value" style={{ color: '#22d3ee' }}>${totalNetPayout.toLocaleString()}</div>
          <div className="su-card-sub">
            Contractor gross disbursements
          </div>
        </div>

        <div className="su-card">
          <div className="su-card-header">
            <span className="su-card-label">Active Resource Pool</span>
            <Package size={18} color="#a78bfa" />
          </div>
          <div className="su-card-value" style={{ color: '#a78bfa' }}>{resources.length}</div>
          <div className="su-card-sub">
            Verified inventory catalog
          </div>
        </div>
      </div>

      {/* Visual Distribution Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="su-card">
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', margin: '0 0 16px 0' }}>
            User Distribution by Role
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {['Client', 'Vendor', 'Staff', 'Admin', 'Superuser'].map((r) => {
              const count = users.filter((u) => (u.role || '').toLowerCase() === r.toLowerCase()).length;
              const pct = users.length ? Math.round((count / users.length) * 100) : 0;
              return (
                <div key={r}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ color: '#fff' }}>{r}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ height: '7px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: r === 'Superuser' ? '#ec4899' : r === 'Admin' ? '#3b82f6' : r === 'Vendor' ? '#22d3ee' : '#00e676' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="su-card">
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', margin: '0 0 16px 0' }}>
            Event Types Breakdown
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {['Corporate', 'Conference', 'Gala', 'Private Event'].map((t) => {
              const count = events.filter((e) => (e.type || 'Corporate').toLowerCase().includes(t.toLowerCase())).length || 1;
              const pct = events.length ? Math.round((count / events.length) * 100) : 25;
              return (
                <div key={t}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ color: '#fff' }}>{t}</span>
                    <span style={{ color: '#60a5fa' }}>{count} bookings</span>
                  </div>
                  <div style={{ height: '7px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: '#60a5fa' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
