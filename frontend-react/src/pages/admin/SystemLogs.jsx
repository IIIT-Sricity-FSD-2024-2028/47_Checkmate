import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, Search, Filter, RefreshCcw, Shield, 
  Clock, Terminal, CheckCircle2, ChevronDown, ChevronRight 
} from 'lucide-react';
import { getStateKey } from '../../services/stateService';
import '../../styles/admin.css';

export default function SystemLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [expandedLogId, setExpandedLogId] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await getStateKey('activityLogs');
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load system logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return logs.filter((log) => {
      const matchesSearch =
        !q ||
        (log.action && log.action.toLowerCase().includes(q)) ||
        (log.user && log.user.toLowerCase().includes(q)) ||
        (log.details && JSON.stringify(log.details).toLowerCase().includes(q)) ||
        (log.ip && log.ip.toLowerCase().includes(q));

      let matchesCat = true;
      if (categoryFilter !== 'all') {
        const act = (log.action || '').toLowerCase();
        if (categoryFilter === 'auth') matchesCat = act.includes('login') || act.includes('auth') || act.includes('token');
        else if (categoryFilter === 'event') matchesCat = act.includes('event');
        else if (categoryFilter === 'user') matchesCat = act.includes('user');
        else if (categoryFilter === 'finance') matchesCat = act.includes('payout') || act.includes('settle') || act.includes('payment');
        else if (categoryFilter === 'mutation') matchesCat = act.includes('create') || act.includes('update') || act.includes('delete') || act.includes('patch');
      }

      return matchesSearch && matchesCat;
    });
  }, [logs, searchTerm, categoryFilter]);

  const renderActionBadge = (action) => {
    const act = (action || '').toLowerCase();
    let style = { background: 'rgba(255,255,255,0.06)', color: '#fff' };

    if (act.includes('approve') || act.includes('settle') || act.includes('create')) {
      style = { background: 'rgba(0, 230, 118, 0.15)', color: '#00e676', border: '1px solid rgba(0, 230, 118, 0.3)' };
    } else if (act.includes('delete') || act.includes('reject') || act.includes('terminate')) {
      style = { background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' };
    } else if (act.includes('update') || act.includes('patch')) {
      style = { background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)' };
    } else if (act.includes('login') || act.includes('auth')) {
      style = { background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899', border: '1px solid rgba(236, 72, 153, 0.3)' };
    }

    return (
      <span style={{ ...style, padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', fontFamily: 'monospace' }}>
        {action || 'ACTION'}
      </span>
    );
  };

  return (
    <div className="admin-page-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#fff', margin: 0 }}>System Audit Logs</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Immutable forensic audit trail capturing authenticated API mutations, decisions, and system events.
          </p>
        </div>

        <button
          onClick={fetchLogs}
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
          <RefreshCcw size={14} className={loading ? 'spin' : ''} /> Refresh Logs
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '300px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search audit trail by action, user, or details..."
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
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
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
            <option value="all">All Event Categories</option>
            <option value="auth">Authentication & Access</option>
            <option value="event">Event Actions</option>
            <option value="user">User Management</option>
            <option value="finance">Finance & Payouts</option>
            <option value="mutation">State Mutations</option>
          </select>
        </div>

        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Showing {filteredLogs.length} entries
        </div>
      </div>

      {/* Audit Logs List */}
      <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCcw size={28} className="spin" style={{ margin: '0 auto 12px auto', display: 'block' }} />
            Loading system audit trail...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No audit logs found matching your filters.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredLogs.map((log, idx) => {
              const logId = log.id || `log_${idx}`;
              const isExpanded = expandedLogId === logId;
              const dateStr = log.timestamp || log.time || log.date;
              const formattedDate = dateStr ? new Date(dateStr).toLocaleString() : 'Recently';

              return (
                <div
                  key={logId}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    padding: '14px 18px',
                    transition: 'background-color 0.15s',
                    background: isExpanded ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                  }}
                >
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    onClick={() => setExpandedLogId(isExpanded ? null : logId)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {renderActionBadge(log.action)}
                      <span style={{ fontSize: '13.5px', color: '#fff', fontWeight: '500' }}>
                        {log.description || log.message || log.action}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        User: <span style={{ color: 'var(--text-secondary)' }}>{log.user || log.userId || 'System'}</span>
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formattedDate}</span>
                      {isExpanded ? <ChevronDown size={16} color="var(--text-muted)" /> : <ChevronRight size={16} color="var(--text-muted)" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop: '12px', padding: '12px', background: '#0a0c12', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '12px', fontFamily: 'monospace' }}>
                      <pre style={{ margin: 0, color: '#60a5fa', overflowX: 'auto' }}>
                        {JSON.stringify(log, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
