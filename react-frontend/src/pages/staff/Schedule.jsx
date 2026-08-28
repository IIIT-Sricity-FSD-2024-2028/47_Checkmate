import React from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Table } from '../../components/common/CommonComponents';

export const Schedule = () => {
  const shifts = [
    { id: 'SH-1', day: 'Monday', date: '2026-08-31', shift: '08:00 AM - 04:00 PM', location: 'Main Warehouse', role: 'Inventory Inspector' },
    { id: 'SH-2', day: 'Wednesday', date: '2026-09-02', shift: '12:00 PM - 10:00 PM', location: 'Sunset Gardens', role: 'Stage Manager' },
    { id: 'SH-3', day: 'Friday', date: '2026-09-04', shift: '09:00 AM - 05:00 PM', location: 'Convention Hall B', role: 'AV Operator' },
  ];

  return (
    <DashboardLayout title="Weekly Shift Roster" subtitle="Your upcoming work shifts and scheduled hours">
      <Card title="Shift Schedule">
        <Table headers={['Shift ID', 'Day', 'Date', 'Shift Timing', 'Location', 'Assigned Role']}>
          {shifts.map((s) => (
            <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <td style={{ padding: '12px 16px', fontSize: '12px', color: '#94a3b8' }}>{s.id}</td>
              <td style={{ padding: '12px 16px', fontWeight: 600 }}>{s.day}</td>
              <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{s.date}</td>
              <td style={{ padding: '12px 16px', color: '#ec4899', fontWeight: 600 }}>{s.shift}</td>
              <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{s.location}</td>
              <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{s.role}</td>
            </tr>
          ))}
        </Table>
      </Card>
    </DashboardLayout>
  );
};
