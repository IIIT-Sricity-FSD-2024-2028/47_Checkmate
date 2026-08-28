import React from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common/CommonComponents';

export const VendorMonitoring = () => {
  return (
    <DashboardLayout title="Live Event Monitoring" subtitle="Real-time telemetry and resource usage tracking">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <Card title="Active Stage Telemetry" subtitle="Sound & Lighting Rigs">
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#10b981', marginTop: '8px' }}>Optimal (99.8%)</div>
        </Card>
        <Card title="Active Power Load" subtitle="Generator Power Draw">
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#3b82f6', marginTop: '8px' }}>42.5 kW / 80 kW</div>
        </Card>
        <Card title="Staff On-Site" subtitle="Crew Active">
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#ec4899', marginTop: '8px' }}>6 Crew Members</div>
        </Card>
      </div>

      <Card title="Event Live Status Log">
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <li style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>11:30 AM</span> — Sound check complete on Stage A. Signal quality 100%.
          </li>
          <li style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>10:45 AM</span> — Catering buffet tables set up in North Wing.
          </li>
        </ul>
      </Card>
    </DashboardLayout>
  );
};
