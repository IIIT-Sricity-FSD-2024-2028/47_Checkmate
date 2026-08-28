import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Table, Button, LoadingSpinner } from '../../components/common/CommonComponents';
import { staffService } from '../../services/api';

export const VendorManageStaff = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const data = await staffService.getAll();
        setStaff(data || [
          { id: 'STF-1', name: 'Alex Johnson', role: 'Sound Engineer', phone: '+1 555-0192', email: 'alex@checkmate.com', status: 'Available' },
          { id: 'STF-2', name: 'Maria Garcia', role: 'Decor Coordinator', phone: '+1 555-0144', email: 'maria@checkmate.com', status: 'On Shift' },
        ]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, []);

  return (
    <DashboardLayout title="Vendor Staff Roster" subtitle="Manage your team members and assign shift work">
      {loading ? (
        <LoadingSpinner message="Fetching staff team..." />
      ) : (
        <Card title={`Team Members (${staff.length})`}>
          <Table headers={['Staff ID', 'Name', 'Speciality Role', 'Contact Phone', 'Email', 'Availability', 'Action']}>
            {staff.map((s) => (
              <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px 16px', fontSize: '12px', color: '#94a3b8' }}>{s.id}</td>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{s.name}</td>
                <td style={{ padding: '12px 16px', color: '#ec4899', fontWeight: 600 }}>{s.role}</td>
                <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{s.phone}</td>
                <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{s.email}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                    {s.status || 'Available'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <Button size="small" variant="outline">Assign Shift</Button>
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      )}
    </DashboardLayout>
  );
};
