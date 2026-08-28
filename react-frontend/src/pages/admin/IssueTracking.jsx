import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Table, Button, LoadingSpinner } from '../../components/common/CommonComponents';
import { issueService } from '../../services/api';

export const IssueTracking = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchIssues = async () => {
    try {
      const data = await issueService.getAll();
      setIssues(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const handleResolve = async (id) => {
    try {
      await issueService.updateStatus(id, 'resolved');
      fetchIssues();
    } catch (e) {
      alert('Error updating issue status');
    }
  };

  return (
    <DashboardLayout title="Issue Tracking System" subtitle="Monitor and resolve client, staff, and vendor incident reports">
      {loading ? (
        <LoadingSpinner message="Fetching issue tickets..." />
      ) : (
        <Card title={`Open & Resolved Tickets (${issues.length})`}>
          <Table headers={['Ticket ID', 'Title / Summary', 'Category', 'Reporter', 'Priority', 'Status', 'Action']}>
            {issues.map((iss) => (
              <tr key={iss.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px 16px', fontSize: '12px', color: '#94a3b8' }}>{iss.id}</td>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{iss.title || iss.subject}</td>
                <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{iss.category}</td>
                <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{iss.reporter || 'User'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '12px', background: iss.priority === 'High' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', color: iss.priority === 'High' ? '#f87171' : '#f59e0b' }}>
                    {iss.priority || 'Medium'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '12px', background: iss.status === 'resolved' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: iss.status === 'resolved' ? '#10b981' : '#f87171' }}>
                    {iss.status || 'open'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {iss.status !== 'resolved' && (
                    <Button size="small" variant="outline" onClick={() => handleResolve(iss.id)}>Mark Resolved</Button>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      )}
    </DashboardLayout>
  );
};
