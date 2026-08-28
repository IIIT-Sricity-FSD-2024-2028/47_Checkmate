import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Table, LoadingSpinner } from '../../components/common/CommonComponents';
import { eventService } from '../../services/api';

export const SuperuserEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await eventService.getAll();
        setEvents(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  return (
    <DashboardLayout title="Superuser Events Control" subtitle="Master event directory across all system tenants">
      {loading ? (
        <LoadingSpinner message="Querying events..." />
      ) : (
        <Card title={`Master Events List (${events.length})`}>
          <Table headers={['Event ID', 'Title', 'Client', 'Date', 'Venue', 'Status']}>
            {events.map((ev) => (
              <tr key={ev.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px 16px', fontSize: '12px', color: '#94a3b8' }}>{ev.id}</td>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{ev.name}</td>
                <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{ev.client || ev.createdBy}</td>
                <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{ev.date}</td>
                <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{ev.venue}</td>
                <td style={{ padding: '12px 16px', color: '#ec4899', fontWeight: 600 }}>{ev.status}</td>
              </tr>
            ))}
          </Table>
        </Card>
      )}
    </DashboardLayout>
  );
};
