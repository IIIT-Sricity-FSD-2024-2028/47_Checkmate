import React from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Table, Button } from '../../components/common/CommonComponents';

export const ClientBilling = () => {
  const invoices = [
    { id: 'INV-2026-081', event: 'Corporate Gala 2026', amount: '$5,000.00', date: '2026-08-27', status: 'Paid' },
    { id: 'INV-2026-082', event: 'Grand Wedding Package Deposit', amount: '$2,500.00', date: '2026-08-28', status: 'Unpaid' },
  ];

  return (
    <DashboardLayout title="Invoices & Billing" subtitle="Review payments, receipts, and outstanding invoice balances">
      <Card title="Billing History & Invoices">
        <Table headers={['Invoice ID', 'Event Name', 'Total Amount', 'Issue Date', 'Payment Status', 'Action']}>
          {invoices.map((inv) => (
            <tr key={inv.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <td style={{ padding: '12px 16px', fontSize: '12px', color: '#94a3b8' }}>{inv.id}</td>
              <td style={{ padding: '12px 16px', fontWeight: 600 }}>{inv.event}</td>
              <td style={{ padding: '12px 16px', color: '#ec4899', fontWeight: 700 }}>{inv.amount}</td>
              <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{inv.date}</td>
              <td style={{ padding: '12px 16px' }}>
                <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: inv.status === 'Paid' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: inv.status === 'Paid' ? '#10b981' : '#f87171' }}>
                  {inv.status}
                </span>
              </td>
              <td style={{ padding: '12px 16px' }}>
                {inv.status === 'Unpaid' ? (
                  <Button size="small" variant="primary">Pay Now</Button>
                ) : (
                  <Button size="small" variant="outline">Download PDF</Button>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </DashboardLayout>
  );
};
