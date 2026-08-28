import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Table, Button, LoadingSpinner } from '../../components/common/CommonComponents';
import { eventService } from '../../services/api';

export const VendorEventRequest = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleAction = async (id, status) => {
    try {
      await eventService.updateStatus(id, status);
      fetchEvents();
    } catch (e) {
      alert('Error updating request');
    }
  };

  return (
    <DashboardLayout title="Client Event Requests" subtitle="Review client bookings and accept or reject event contracts">
      {loading ? (
        <LoadingSpinner message="Fetching pending requests..." />
      ) : (
        <Card title={`Pending Client Submissions (${events.length})`}>
          <Table headers={['Request ID', 'Event Title', 'Client Name', 'Requested Date', 'Guests', 'Budget', 'Status', 'Actions']}>
            {events.map((ev) => (
              <tr key={ev.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px 16px', fontSize: '12px', color: '#94a3b8' }}>{ev.id}</td>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{ev.name}</td>
                <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{ev.client || ev.createdBy}</td>
                <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{ev.date}</td>
                <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{ev.people || ev.guests || 100}</td>
                <td style={{ padding: '12px 16px', color: '#ec4899', fontWeight: 600 }}>${ev.budget || 0}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', textTransform: 'capitalize' }}>
                    {ev.status || 'pending'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
                  <Button size="small" variant="primary" onClick={() => handleAction(ev.id, 'approved')}>Accept Request</Button>
                  <Button size="small" variant="danger" onClick={() => handleAction(ev.id, 'rejected')}>Decline</Button>
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      )}
    </DashboardLayout>
  );
};
