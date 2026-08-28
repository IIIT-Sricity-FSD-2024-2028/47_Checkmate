import React, { useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Button } from '../../components/common/CommonComponents';

export const TaskBoard = () => {
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Verify Wireless Microphones', status: 'To Do', event: 'Corporate Gala' },
    { id: 2, title: 'Test Main Stage LED Backdrop', status: 'In Progress', event: 'Corporate Gala' },
    { id: 3, title: 'Safety Briefing with Venue Supervisor', status: 'Completed', event: 'Corporate Gala' },
  ]);

  const moveStatus = (id, newStatus) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  const columns = ['To Do', 'In Progress', 'Completed'];

  return (
    <DashboardLayout title="Staff Task Kanban Board" subtitle="Track and update task progress for your assigned events">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        {columns.map((col) => (
          <Card key={col} title={`${col} (${tasks.filter(t => t.status === col).length})`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '300px' }}>
              {tasks.filter(t => t.status === col).map((task) => (
                <div key={task.id} style={{ padding: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '12px', color: '#ec4899', fontWeight: 600, marginBottom: '4px' }}>{task.event}</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '12px' }}>{task.title}</div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {col !== 'To Do' && (
                      <Button size="small" variant="secondary" onClick={() => moveStatus(task.id, col === 'Completed' ? 'In Progress' : 'To Do')}>&larr; Back</Button>
                    )}
                    {col !== 'Completed' && (
                      <Button size="small" variant="primary" onClick={() => moveStatus(task.id, col === 'To Do' ? 'In Progress' : 'Completed')}>Advance &rarr;</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
};
