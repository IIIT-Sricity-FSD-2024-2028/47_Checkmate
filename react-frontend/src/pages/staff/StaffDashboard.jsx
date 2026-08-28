import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Table, LoadingSpinner } from '../../components/common/CommonComponents';
import { staffService } from '../../services/api';

export const StaffDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const data = await staffService.getTasks();
        setTasks(data || [
          { id: 'TSK-1', name: 'Stage Rigging Inspection', event: 'Corporate Gala 2026', priority: 'High', status: 'In Progress' },
          { id: 'TSK-2', name: 'Microphone & Mixer Audio Check', event: 'Grand Wedding', priority: 'Medium', status: 'Assigned' },
        ]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  return (
    <DashboardLayout title="Staff Workspace" subtitle="Assigned events, tasks, and shifts overview">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        <Card title="Assigned Tasks" subtitle="Active Shift Tasks" icon={<i className="ph ph-check-square"></i>}>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#ec4899', marginTop: '8px' }}>{tasks.length}</div>
        </Card>
        <Card title="Active Events" subtitle="Upcoming On-Site Shifts" icon={<i className="ph ph-calendar"></i>}>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#3b82f6', marginTop: '8px' }}>2</div>
        </Card>
        <Card title="Efficiency Score" subtitle="Task Completion Rate" icon={<i className="ph ph-trend-up"></i>}>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#10b981', marginTop: '8px' }}>98.5%</div>
        </Card>
      </div>

      <Card title="My Immediate Tasks">
        {loading ? (
          <LoadingSpinner message="Fetching task queue..." />
        ) : (
          <Table headers={['Task ID', 'Task Description', 'Event Name', 'Priority', 'Status']}>
            {tasks.map((t) => (
              <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px 16px', fontSize: '12px', color: '#94a3b8' }}>{t.id}</td>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{t.name || t.title}</td>
                <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{t.event || t.eventName}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '12px', background: t.priority === 'High' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', color: t.priority === 'High' ? '#f87171' : '#f59e0b' }}>
                    {t.priority || 'Medium'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '12px', background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>
                    {t.status || 'Assigned'}
                  </span>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </DashboardLayout>
  );
};
