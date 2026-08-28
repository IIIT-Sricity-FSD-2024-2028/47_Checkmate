import React from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Table, Button } from '../../components/common/CommonComponents';

export const AssignedEvents = () => {
  const events = [
    { id: 'EVT-201', name: 'Corporate Tech Gala 2026', role: 'Lead Audio Specialist', date: '2026-08-30', shift: '08:00 AM - 06:00 PM', venue: 'Grand Horizon Center', status: 'Confirmed' },
    { id: 'EVT-202', name: 'Smith-Davis Wedding', role: 'Stage Manager', date: '2026-09-02', shift: '12:00 PM - 10:00 PM', venue: 'Sunset Gardens', status: 'Upcoming' },
  ];

  return (
    <DashboardLayout title="Assigned Events" subtitle="Events where you are scheduled to provide staff support">
      <Card title="Upcoming Shift Assignments">
        <Table headers={['Event ID', 'Event Name', 'Your On-Site Role', 'Date', 'Shift Time', 'Venue', 'Status', 'Actions']}>
          {events.map((ev) => (
            <tr key={ev.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <td style={{ padding: '12px 16px', fontSize: '12px', color: '#94a3b8' }}>{ev.id}</td>
              <td style={{ padding: '12px 16px', fontWeight: 600 }}>{ev.name}</td>
              <td style={{ padding: '12px 16px', color: '#ec4899', fontWeight: 600 }}>{ev.role}</td>
              <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{ev.date}</td>
              <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{ev.shift}</td>
              <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{ev.venue}</td>
              <td style={{ padding: '12px 16px' }}>
                <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>{ev.status}</span>
              </td>
              <td style={{ padding: '12px 16px' }}>
                <Button size="small" variant="outline">Check In</Button>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </DashboardLayout>
  );
};
