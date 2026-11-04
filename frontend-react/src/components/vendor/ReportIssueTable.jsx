import React from 'react';
import { Bug, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ReportIssueTable({ issues = [], onRefresh }) {
  return (
    <div className="card" style={{ marginTop: '20px' }}>
      <div className="card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bug size={16} className="text-pink" />
          <h3 style={{ margin: 0 }}>Incident Tickets & Resolution History</h3>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {issues.length} Total Registered Ticket{issues.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="table-wrapper" style={{ overflowX: 'auto' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Incident Summary</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Associated Event</th>
              <th>Status</th>
              <th>Reported</th>
            </tr>
          </thead>
          <tbody>
            {issues.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No issues or incident tickets logged. All operational streams functioning normally.
                </td>
              </tr>
            ) : (
              issues.map((iss) => {
                const status = String(iss.status || 'open').toLowerCase();
                const prio = String(iss.priority || iss.severity || 'medium').toLowerCase();

                return (
                  <tr key={iss.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--pink)' }}>
                      #{iss.id}
                    </td>
                    <td style={{ maxWidth: '280px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{iss.title}</div>
                      {iss.description && (
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {iss.description}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="mon-staff-role-pill">{iss.category || 'Operations'}</span>
                    </td>
                    <td>
                      <span className={`risk-pill risk-pill--${prio}`}>
                        {prio}
                      </span>
                    </td>
                    <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      {iss.eventName || iss.event || 'General System'}
                    </td>
                    <td>
                      {status === 'resolved' || status === 'closed' ? (
                        <span className="badge badge--confirmed" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={12} /> Resolved
                        </span>
                      ) : status === 'in_progress' ? (
                        <span className="badge badge--live" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> In Review
                        </span>
                      ) : (
                        <span className="badge badge--pending" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <AlertCircle size={12} /> Open
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {iss.createdAt ? new Date(iss.createdAt).toLocaleDateString() : 'Today'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

