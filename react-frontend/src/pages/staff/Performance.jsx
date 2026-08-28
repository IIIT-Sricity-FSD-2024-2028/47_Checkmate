import React from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common/CommonComponents';

export const Performance = () => {
  return (
    <DashboardLayout title="Staff Performance Ratings" subtitle="Track your shift metrics, ratings, and performance reviews">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <Card title="Punctuality Score" subtitle="Shift Check-ins">
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#10b981', marginTop: '8px' }}>99.2%</div>
        </Card>
        <Card title="Task Accuracy" subtitle="Kanban Task Completions">
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#ec4899', marginTop: '8px' }}>97.8%</div>
        </Card>
        <Card title="Client Feedback Rating" subtitle="Post-Event Survey">
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#f59e0b', marginTop: '8px' }}>4.9 / 5.0 ⭐</div>
        </Card>
      </div>

      <Card title="Supervisor & Client Commendations">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>"Exceptional stage setup speed!"</div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>— Sarah Jenkins (Corporate Event Lead), Aug 2026</div>
          </div>
        </div>
      </Card>
    </DashboardLayout>
  );
};
