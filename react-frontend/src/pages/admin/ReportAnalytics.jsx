import React from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common/CommonComponents';

export const ReportAnalytics = () => {
  return (
    <DashboardLayout title="System Analytics & Reports" subtitle="Performance metrics, revenue, and platform growth breakdown">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <Card title="Monthly Gross Revenue" subtitle="Current Year Growth">
          <div style={{ fontSize: '36px', fontWeight: 800, color: '#ec4899', marginTop: '8px' }}>$142,500.00</div>
          <div style={{ fontSize: '13px', color: '#10b981', marginTop: '6px' }}>↑ +18.4% compared to last month</div>
        </Card>
        <Card title="Event Completion Rate" subtitle="Quality Assurance">
          <div style={{ fontSize: '36px', fontWeight: 800, color: '#10b981', marginTop: '8px' }}>98.2%</div>
          <div style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '6px' }}>148 completed out of 151 total</div>
        </Card>
        <Card title="Vendor Retention Rate" subtitle="Active Vendors">
          <div style={{ fontSize: '36px', fontWeight: 800, color: '#3b82f6', marginTop: '8px' }}>96.5%</div>
          <div style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '6px' }}>High vendor satisfaction rating</div>
        </Card>
      </div>

      <Card title="Revenue Distribution by Event Category">
        <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
              <span>Corporate Conferences</span>
              <span>45% ($64,125)</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '4px', height: '10px', overflow: 'hidden' }}>
              <div style={{ width: '45%', background: '#ec4899', height: '100%' }}></div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
              <span>Weddings & Ceremonies</span>
              <span>35% ($49,875)</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '4px', height: '10px', overflow: 'hidden' }}>
              <div style={{ width: '35%', background: '#8b5cf6', height: '100%' }}></div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
              <span>Private Galas & Parties</span>
              <span>20% ($28,500)</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '4px', height: '10px', overflow: 'hidden' }}>
              <div style={{ width: '20%', background: '#3b82f6', height: '100%' }}></div>
            </div>
          </div>
        </div>
      </Card>
    </DashboardLayout>
  );
};
