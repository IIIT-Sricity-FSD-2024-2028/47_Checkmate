import React from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Table } from '../../components/common/CommonComponents';

export const SuperuserBookings = () => {
  const bookings = [
    { id: 'BKG-901', event: 'Corporate Gala 2026', client: 'Acme Corp', vendor: 'Apex Caterers', total: '$12,500.00', status: 'Confirmed' },
    { id: 'BKG-902', event: 'Smith Wedding', client: 'John Smith', vendor: 'Starlight Lighting', total: '$4,800.00', status: 'Pending Deposit' },
  ];

  return (
    <DashboardLayout title="Superuser Bookings Master" subtitle="All contractual bookings and financial transactions">
      <Card title="Master Booking Ledger">
        <Table headers={['Booking ID', 'Event Name', 'Client', 'Vendor', 'Total Value', 'Status']}>
          {bookings.map((b) => (
            <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <td style={{ padding: '12px 16px', fontSize: '12px', color: '#94a3b8' }}>{b.id}</td>
              <td style={{ padding: '12px 16px', fontWeight: 600 }}>{b.event}</td>
              <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{b.client}</td>
              <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{b.vendor}</td>
              <td style={{ padding: '12px 16px', color: '#ec4899', fontWeight: 700 }}>{b.total}</td>
              <td style={{ padding: '12px 16px', color: '#10b981' }}>{b.status}</td>
            </tr>
          ))}
        </Table>
      </Card>
    </DashboardLayout>
  );
};
