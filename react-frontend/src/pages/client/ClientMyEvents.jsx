import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Table, Button, LoadingSpinner } from '../../components/common/CommonComponents';
import { eventService } from '../../services/api';

export const ClientMyEvents = () => {
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
    <DashboardLayout title="My Event Bookings" subtitle="Manage and review all your submitted events">
      {loading ? (
        <LoadingSpinner message="Fetching your events..." />
      ) : (
        <Card title={`Booked Events (${events.length})`}>
          <Table headers={['Event ID', 'Event Name', 'Category', 'Date', 'Venue', 'Budget', 'Status', 'Actions']}>
            {events.map((ev) => (
              <tr key={ev.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px 16px', fontSize: '12px', color: '#94a3b8' }}>{ev.id}</td>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{ev.name}</td>
                <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{ev.type || 'Conference'}</td>
                <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{ev.date}</td>
                <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{ev.venue || 'TBD'}</td>
                <td style={{ padding: '12px 16px', color: '#ec4899', fontWeight: 600 }}>${ev.budget || 0}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: 'rgba(59,130,246,0.15)', color: '#60a5fa', textTransform: 'capitalize' }}>
                    {ev.status || 'pending'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <Link to="/client/track-progress">
                    <Button variant="outline" size="small">Track Live</Button>
                  </Link>
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      )}
    </DashboardLayout>
  );
};
