import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Table, Button, LoadingSpinner } from '../../components/common/CommonComponents';
import { userService } from '../../services/api';

export const SuperuserUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const data = await userService.getAll();
      setUsers(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <DashboardLayout title="Superuser Users Control" subtitle="Direct CRUD and override control over all user accounts">
      {loading ? (
        <LoadingSpinner message="Querying user database..." />
      ) : (
        <Card title={`All Database Users (${users.length})`}>
          <Table headers={['User ID', 'Name', 'Email', 'Role', 'Status', 'Root Actions']}>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px 16px', fontSize: '12px', color: '#94a3b8' }}>{u.id}</td>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{u.name}</td>
                <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{u.email}</td>
                <td style={{ padding: '12px 16px', color: '#ec4899', fontWeight: 600 }}>{u.role}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '12px', background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>{u.status || 'Active'}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <Button size="small" variant="danger">Delete Account</Button>
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      )}
    </DashboardLayout>
  );
};
