import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Table, LoadingSpinner } from '../../components/common/CommonComponents';
import { staffService } from '../../services/api';

export const SuperuserStaff = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const data = await staffService.getAll();
        setStaff(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, []);

  return (
    <DashboardLayout title="Superuser Staff Master" subtitle="All staff profiles and assignments across the system">
      {loading ? (
        <LoadingSpinner message="Querying staff roster..." />
      ) : (
        <Card title={`Master Staff Directory (${staff.length})`}>
          <Table headers={['Staff ID', 'Name', 'Speciality Role', 'Email', 'Status']}>
            {staff.map((s) => (
              <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px 16px', fontSize: '12px', color: '#94a3b8' }}>{s.id}</td>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{s.name}</td>
                <td style={{ padding: '12px 16px', color: '#ec4899', fontWeight: 600 }}>{s.role}</td>
                <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{s.email}</td>
                <td style={{ padding: '12px 16px', color: '#10b981' }}>{s.status || 'Active'}</td>
              </tr>
            ))}
          </Table>
        </Card>
      )}
    </DashboardLayout>
  );
};
