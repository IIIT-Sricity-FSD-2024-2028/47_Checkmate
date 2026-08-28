import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Table, LoadingSpinner } from '../../components/common/CommonComponents';
import { userService, eventService } from '../../services/api';

export const SuperuserDashboard = () => {
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [u, e] = await Promise.all([userService.getAll(), eventService.getAll()]);
        setUsers(u || []);
        setEvents(e || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <DashboardLayout title="Superuser Master Control" subtitle="Root administration over database collections and system state">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        <Card title="System Database Users" subtitle="Master Records" icon={<i className="ph ph-database"></i>}>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#ec4899', marginTop: '8px' }}>{users.length}</div>
        </Card>
        <Card title="Database Events" subtitle="Master Records" icon={<i className="ph ph-calendar"></i>}>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#3b82f6', marginTop: '8px' }}>{events.length}</div>
        </Card>
        <Card title="NestJS API Status" subtitle="Port 3000" icon={<i className="ph ph-activity"></i>}>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#10b981', marginTop: '12px' }}>Online & Syncing</div>
        </Card>
      </div>

      <Card title="Master Database Overview">
        {loading ? (
          <LoadingSpinner message="Fetching root database records..." />
        ) : (
          <Table headers={['User ID', 'Name', 'Email', 'Role', 'Status']}>
            {users.slice(0, 5).map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px 16px', fontSize: '12px', color: '#94a3b8' }}>{u.id}</td>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{u.name}</td>
                <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{u.email}</td>
                <td style={{ padding: '12px 16px', color: '#ec4899' }}>{u.role}</td>
                <td style={{ padding: '12px 16px', color: '#10b981' }}>{u.status || 'active'}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </DashboardLayout>
  );
};
