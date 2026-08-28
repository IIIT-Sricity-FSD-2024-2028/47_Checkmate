import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Table, Button, LoadingSpinner } from '../../components/common/CommonComponents';
import { eventService } from '../../services/api';

export const ClientDashboard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await eventService.getAll();
        setEvents(data || []);
      } catch (e) {
        console.error('Error fetching client events:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Client Dashboard" subtitle="Overview of your event bookings and active requests">
        <LoadingSpinner message="Loading client dashboard..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Client Dashboard" subtitle="Overview of your event bookings and active requests">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        <Card title="Active Events" subtitle="Currently in progress" icon={<i className="ph ph-rocket-launch"></i>}>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#ec4899', marginTop: '8px' }}>{events.length}</div>
        </Card>
        <Card title="Browse Packages" subtitle="Curated Event Bundles" icon={<i className="ph ph-package"></i>}>
          <Link to="/client/browse-packages" style={{ textDecoration: 'none' }}>
            <Button variant="outline" size="small" style={{ marginTop: '12px' }}>Explore Packages &rarr;</Button>
          </Link>
        </Card>
        <Card title="Create Event" subtitle="Book New Ceremony" icon={<i className="ph ph-plus-circle"></i>}>
          <Link to="/client/create-event" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="small" style={{ marginTop: '12px' }}>New Request +</Button>
          </Link>
        </Card>
      </div>

      <Card title="My Event Submissions">
        {events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
            You haven't submitted any event requests yet.
            <div style={{ marginTop: '12px' }}>
              <Link to="/client/create-event">
                <Button>Create Your First Event</Button>
              </Link>
            </div>
          </div>
        ) : (
          <Table headers={['Event Name', 'Type', 'Date', 'Venue', 'Guests', 'Status', 'Actions']}>
            {events.map((ev) => (
              <tr key={ev.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{ev.name}</td>
                <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{ev.type || 'Conference'}</td>
                <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{ev.date}</td>
                <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{ev.venue || 'TBD'}</td>
                <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{ev.people || ev.guests || 100}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', textTransform: 'capitalize' }}>
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
        )}
      </Card>
    </DashboardLayout>
  );
};
