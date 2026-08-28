import React from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Table } from '../../components/common/CommonComponents';

export const AuditLogs = () => {
  const logs = [
    { id: 'LOG-8801', actor: 'Admin (System)', action: 'Approved Vendor Application: Apex Caterers', timestamp: '2026-08-28 11:42:10', ip: '192.168.1.1' },
    { id: 'LOG-8802', actor: 'Client (Sarah)', action: 'Submitted Event Request: Corporate Gala', timestamp: '2026-08-28 10:15:22', ip: '192.168.1.45' },
    { id: 'LOG-8803', actor: 'Vendor (Starlight)', action: 'Allocated Resource: Sound System Rig X', timestamp: '2026-08-28 09:30:00', ip: '192.168.1.88' },
    { id: 'LOG-8804', actor: 'Staff (Alex)', action: 'Updated Task Board item to Completed', timestamp: '2026-08-27 16:20:11', ip: '192.168.1.12' },
  ];

  return (
    <DashboardLayout title="System Audit Logs" subtitle="Security audit trail of all administrative and platform actions">
      <Card title="Activity Log Stream">
        <Table headers={['Log ID', 'Actor / User', 'Action Performed', 'Timestamp', 'IP Address']}>
          {logs.map((log) => (
            <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <td style={{ padding: '12px 16px', fontSize: '12px', color: '#94a3b8' }}>{log.id}</td>
              <td style={{ padding: '12px 16px', fontWeight: 600, color: '#ec4899' }}>{log.actor}</td>
              <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{log.action}</td>
              <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px' }}>{log.timestamp}</td>
              <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '12px' }}>{log.ip}</td>
            </tr>
          ))}
        </Table>
      </Card>
    </DashboardLayout>
  );
};
