import React from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Table, Button } from '../../components/common/CommonComponents';

export const AdminPayouts = () => {
  const payouts = [
    { id: 'PAY-101', vendor: 'Apex Caterers', amount: '$4,500.00', date: '2026-08-20', status: 'Completed' },
    { id: 'PAY-102', vendor: 'Starlight Lighting & Sound', amount: '$2,800.00', date: '2026-08-22', status: 'Pending Approval' },
    { id: 'PAY-103', vendor: 'Grand Decor Co.', amount: '$6,200.00', date: '2026-08-25', status: 'Completed' },
  ];

  return (
    <DashboardLayout title="Vendor Payouts & Disbursements" subtitle="Manage vendor commission settlements and payout records">
      <Card title="Payout Transactions History">
        <Table headers={['Payout Ref ID', 'Vendor Partner', 'Total Amount', 'Disbursement Date', 'Status', 'Actions']}>
          {payouts.map((p) => (
            <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <td style={{ padding: '12px 16px', fontSize: '12px', color: '#94a3b8' }}>{p.id}</td>
              <td style={{ padding: '12px 16px', fontWeight: 600 }}>{p.vendor}</td>
              <td style={{ padding: '12px 16px', color: '#ec4899', fontWeight: 700 }}>{p.amount}</td>
              <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{p.date}</td>
              <td style={{ padding: '12px 16px' }}>
                <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', background: p.status === 'Completed' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: p.status === 'Completed' ? '#10b981' : '#f59e0b' }}>
                  {p.status}
                </span>
              </td>
              <td style={{ padding: '12px 16px' }}>
                <Button size="small" variant="outline">View Receipt</Button>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </DashboardLayout>
  );
};
