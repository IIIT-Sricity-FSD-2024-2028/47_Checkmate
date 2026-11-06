import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bug, AlertTriangle, CheckCircle, Clock, Search, 
  Filter, Eye, RefreshCcw, X, ShieldAlert, ArrowRight, User
} from 'lucide-react';
import { getIssues, patchIssue } from '../../services/issueService';
import '../../styles/admin.css';

export default function IssueTracking() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getIssues();
      setIssues(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load issues:', err);
      setError('Failed to fetch platform issues.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  // Compute stat counts
  const stats = useMemo(() => {
    const counts = { open: 0, investigating: 0, resolved: 0 };
    issues.forEach((iss) => {
      const s = (iss.status || '').toLowerCase();
      if (s === 'open') counts.open++;
      else if (s === 'investigating' || s === 'in-progress' || s === 'in progress') counts.investigating++;
      else if (s === 'resolved' || s === 'closed') counts.resolved++;
    });
    return counts;
  }, [issues]);

  // Filtering
  const filteredIssues = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return issues.filter((iss) => {
      const matchesSearch = 
        !q ||
        (iss.id && iss.id.toLowerCase().includes(q)) ||
        (iss.title && iss.title.toLowerCase().includes(q)) ||
        (iss.reporter && iss.reporter.toLowerCase().includes(q)) ||
        (iss.event && iss.event.toLowerCase().includes(q)) ||
        (iss.eventId && iss.eventId.toLowerCase().includes(q)) ||
        (iss.description && iss.description.toLowerCase().includes(q));

      const s = (iss.status || 'open').toLowerCase();
      let matchesStatus = true;
      if (statusFilter !== 'all') {
        matchesStatus = s === statusFilter.toLowerCase();
      }

      const p = (iss.priority || 'medium').toLowerCase();
      let matchesPriority = true;
      if (priorityFilter !== 'all') {
        matchesPriority = p === priorityFilter.toLowerCase();
      }

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [issues, searchTerm, statusFilter, priorityFilter]);

  const handleStatusChange = async (issueId, newStatus) => {
    try {
      setActionLoading(true);
      await patchIssue(issueId, { status: newStatus });
      await fetchIssues();
      if (selectedIssue && selectedIssue.id === issueId) {
        setSelectedIssue((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error('Failed to update issue status:', err);
      alert('Failed to update issue status.');
    } finally {
      setActionLoading(false);
    }
  };

  const renderPriorityBadge = (priority) => {
    const p = (priority || 'medium').toLowerCase();
    let style = { background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)' };
    if (p === 'high' || p === 'urgent' || p === 'critical') {
      style = { background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' };
    } else if (p === 'medium') {
      style = { background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' };
    } else if (p === 'low') {
      style = { background: 'rgba(0, 230, 118, 0.15)', color: '#00e676', border: '1px solid rgba(0, 230, 118, 0.3)' };
    }

    return (
      <span style={{ ...style, padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', textTransform: 'capitalize' }}>
        {priority || 'Medium'}
      </span>
    );
  };

  const renderStatusBadge = (status) => {
    const s = (status || 'open').toLowerCase();
    let style = { background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' };
    let label = 'Open';

    if (s === 'investigating' || s === 'in-progress' || s === 'in progress') {
      style = { background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' };
      label = 'Investigating';
    } else if (s === 'resolved' || s === 'closed') {
      style = { background: 'rgba(0, 230, 118, 0.15)', color: '#00e676' };
      label = 'Resolved';
    }

    return (
      <span style={{ ...style, padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
        {label}
      </span>
    );
  };

  return (
    <div className="admin-page-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#fff', margin: 0 }}>Issue Tracking Hub</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
          Centralized triage for operational incidents, client disputes, and equipment malfunctions.
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Open Escalations</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '700', color: '#ef4444', marginTop: '10px' }}>
            {stats.open}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Requires admin action
          </div>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Under Investigation</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '700', color: '#3b82f6', marginTop: '10px' }}>
            {stats.investigating}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            In progress triage
          </div>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Resolved Issues</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(0, 230, 118, 0.1)', color: '#00e676' }}>
              <CheckCircle size={18} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '700', color: '#00e676', marginTop: '10px' }}>
            {stats.resolved}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Successfully closed
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '300px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search issues by ID, title, reporter, or event..."
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
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
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
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <button
          onClick={fetchIssues}
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

      {/* Issues Table */}
      <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCcw size={28} className="spin" style={{ margin: '0 auto 12px auto', display: 'block' }} />
            Loading issues...
          </div>
        ) : filteredIssues.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No issues found matching your filters.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Issue ID</th>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Headline</th>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Priority</th>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Reporter</th>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Related Event</th>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '14px 16px', fontWeight: '600', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIssues.map((iss) => {
                const s = (iss.status || 'open').toLowerCase();
                const isOpen = s === 'open';
                const isInvestigating = s === 'investigating' || s === 'in-progress' || s === 'in progress';

                return (
                  <tr key={iss.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: '600', color: '#fff' }}>{iss.id}</td>
                    <td style={{ padding: '14px 16px', color: '#fff', fontWeight: '500' }}>
                      <div>{iss.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{iss.category || 'General'}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>{renderPriorityBadge(iss.priority)}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ color: '#fff', fontWeight: '500' }}>{iss.reporter || 'Anonymous'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{iss.reporterRole || iss.role || 'User'}</div>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                      {iss.eventId || iss.event || 'None'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>{renderStatusBadge(iss.status)}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setSelectedIssue(iss)}
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

                        {isOpen && (
                          <button
                            disabled={actionLoading}
                            onClick={() => handleStatusChange(iss.id, 'investigating')}
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
                            <Clock size={13} /> Investigate
                          </button>
                        )}

                        {isInvestigating && (
                          <button
                            disabled={actionLoading}
                            onClick={() => handleStatusChange(iss.id, 'resolved')}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 10px',
                              background: 'rgba(0, 230, 118, 0.15)',
                              border: '1px solid rgba(0, 230, 118, 0.4)',
                              borderRadius: '6px',
                              color: '#00e676',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                            }}
                          >
                            <CheckCircle size={13} /> Resolve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Issue Detail Modal */}
      {selectedIssue && (
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
          onClick={() => setSelectedIssue(null)}
        >
          <div
            style={{
              background: '#12141c',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              width: '100%',
              maxWidth: '600px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedIssue(null)}
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
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>{selectedIssue.id}</span>
              {renderStatusBadge(selectedIssue.status)}
              {renderPriorityBadge(selectedIssue.priority)}
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#fff', margin: '0 0 16px 0' }}>
              {selectedIssue.title}
            </h2>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Description
              </div>
              <div style={{ fontSize: '13.5px', color: '#fff', lineHeight: '1.5' }}>
                {selectedIssue.description || selectedIssue.desc || 'No detailed description provided.'}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Reporter</div>
                <div style={{ fontSize: '13.5px', color: '#fff', fontWeight: '600', marginTop: '2px' }}>{selectedIssue.reporter || 'Anonymous'}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{selectedIssue.email || selectedIssue.reporterRole || 'Client'}</div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Related Event</div>
                <div style={{ fontSize: '13.5px', color: '#60a5fa', fontWeight: '600', marginTop: '2px' }}>{selectedIssue.eventId || selectedIssue.event || 'None'}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{selectedIssue.createdAt ? new Date(selectedIssue.createdAt).toLocaleDateString() : 'Recent'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setSelectedIssue(null)}
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

              {(selectedIssue.status || '').toLowerCase() === 'open' && (
                <button
                  disabled={actionLoading}
                  onClick={() => handleStatusChange(selectedIssue.id, 'investigating')}
                  style={{
                    padding: '8px 16px',
                    background: '#3b82f6',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Mark In-Progress
                </button>
              )}

              {((selectedIssue.status || '').toLowerCase() === 'investigating' || (selectedIssue.status || '').toLowerCase() === 'in-progress') && (
                <button
                  disabled={actionLoading}
                  onClick={() => handleStatusChange(selectedIssue.id, 'resolved')}
                  style={{
                    padding: '8px 16px',
                    background: '#00e676',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#000',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Resolve Issue
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

