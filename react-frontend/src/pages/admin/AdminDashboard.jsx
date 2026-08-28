import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Table, LoadingSpinner } from '../../components/common/CommonComponents';
import { vendorService, eventService, userService } from '../../services/api';

export const AdminDashboard = () => {
  const [stats, setStats] = useState({ vendors: 0, events: 0, users: 0, pendingApprovals: 0 });
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [apps, evs, usrs] = await Promise.all([
          vendorService.getApplications(),
          eventService.getAll(),
          userService.getAll(),
        ]);
        setApplications(apps || []);
        const pendingCount = (apps || []).filter((a) => a.status === 'pending').length;
        setStats({
          vendors: (apps || []).length,
          events: (evs || []).length,
          users: (usrs || []).length,
          pendingApprovals: pendingCount,
        });
      } catch (e) {
        console.error('Error fetching admin dashboard data:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Admin Overview" subtitle="System Control & Management">
        <LoadingSpinner message="Fetching administrative metrics..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Admin Overview" subtitle="System Control & Management">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        <Card title="Total Vendors" subtitle="Registered Partners" icon={<i className="ph ph-storefront"></i>}>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#ec4899', marginTop: '10px' }}>{stats.vendors}</div>
        </Card>
        <Card title="Pending Approvals" subtitle="Applications to Review" icon={<i className="ph ph-hourglass-high"></i>}>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#f59e0b', marginTop: '10px' }}>{stats.pendingApprovals}</div>
        </Card>
        <Card title="Active Events" subtitle="Total Managed" icon={<i className="ph ph-calendar-check"></i>}>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#3b82f6', marginTop: '10px' }}>{stats.events}</div>
        </Card>
        <Card title="System Users" subtitle="Clients, Staff & Vendors" icon={<i className="ph ph-users-three"></i>}>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#10b981', marginTop: '10px' }}>{stats.users}</div>
        </Card>
      </div>

      <Card title="Recent Vendor Applications" subtitle="Pending & Processed Applications">
        <Table headers={['Vendor Name', 'Business', 'Email', 'Phone', 'Status']}>
          {applications.slice(0, 5).map((v) => (
            <tr key={v.id || v.email} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <td style={{ padding: '12px 16px', fontWeight: 600 }}>{v.vendorName}</td>
              <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{v.businessName}</td>
              <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{v.email}</td>
              <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{v.phone}</td>
              <td style={{ padding: '12px 16px' }}>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  background: v.status === 'approved' ? 'rgba(16,185,129,0.15)' : v.status === 'rejected' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                  color: v.status === 'approved' ? '#10b981' : v.status === 'rejected' ? '#f87171' : '#f59e0b'
                }}>
                  {v.status || 'pending'}
                </span>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </DashboardLayout>
  );
};
