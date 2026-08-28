import React from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common/CommonComponents';

export const ClientTrackProgress = () => {
  const steps = [
    { title: '1. Event Request Submitted', status: 'completed', time: 'Aug 24, 2026' },
    { title: '2. Vendor Review & Approval', status: 'completed', time: 'Aug 25, 2026' },
    { title: '3. Staff & Resource Allocation', status: 'in-progress', time: 'Aug 27, 2026' },
    { title: '4. Final Stage Setup & Execution', status: 'upcoming', time: 'Pending' },
  ];

  return (
    <DashboardLayout title="Live Event Progress Tracking" subtitle="Real-time execution sequence monitoring for your active event">
      <Card title="Corporate Gala 2026 - Execution Milestones">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', margin: '20px 0' }}>
          {steps.map((step, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                background: step.status === 'completed' ? '#10b981' : step.status === 'in-progress' ? '#ec4899' : 'rgba(255,255,255,0.1)',
                color: '#fff'
              }}>
                {step.status === 'completed' ? '✓' : idx + 1}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: '16px', color: '#fff' }}>{step.title}</h4>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Updated: {step.time}</span>
              </div>
              <span style={{
                fontSize: '12px',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: '6px',
                textTransform: 'capitalize',
                background: step.status === 'completed' ? 'rgba(16,185,129,0.15)' : step.status === 'in-progress' ? 'rgba(233,30,140,0.15)' : 'rgba(255,255,255,0.05)',
                color: step.status === 'completed' ? '#10b981' : step.status === 'in-progress' ? '#ec4899' : '#94a3b8'
              }}>
                {step.status}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </DashboardLayout>
  );
};
