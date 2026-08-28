import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Table, Button, Modal, LoadingSpinner } from '../../components/common/CommonComponents';
import { eventService } from '../../services/api';

export const MonitorEvents = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      const data = await eventService.getAll();
      setEvents(data || []);
    } catch (e) {
      console.error('Error fetching events:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      await eventService.updateStatus(id, status);
      fetchEvents();
    } catch (e) {
      alert('Error updating status: ' + e.message);
    }
  };

  return (
    <DashboardLayout title="Monitor Events" subtitle="Track live status and approval stages of all events">
      {loading ? (
        <LoadingSpinner message="Fetching active events..." />
      ) : (
        <Card title={`All System Events (${events.length})`}>
          <Table headers={['Event ID', 'Event Name', 'Client', 'Date', 'Venue', 'Status', 'Actions']}>
            {events.map((ev) => (
              <tr key={ev.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px 16px', fontSize: '12px', color: '#94a3b8' }}>{ev.id}</td>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{ev.name}</td>
                <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{ev.client || ev.createdBy}</td>
                <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{ev.date}</td>
                <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{ev.venue || 'TBD'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: 'rgba(59,130,246,0.15)', color: '#60a5fa', textTransform: 'capitalize' }}>
                    {ev.status || 'pending'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
                  <Button variant="outline" size="small" onClick={() => setSelectedEvent(ev)}>View</Button>
                  {ev.status === 'pending' && (
                    <Button variant="primary" size="small" onClick={() => handleStatusUpdate(ev.id, 'approved')}>Approve</Button>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      {selectedEvent && (
        <Modal
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          title={`Event Details: ${selectedEvent.name}`}
          footer={<Button variant="secondary" onClick={() => setSelectedEvent(null)}>Close</Button>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: '#cbd5e1' }}>
            <div><strong>Client:</strong> {selectedEvent.client || selectedEvent.createdBy}</div>
            <div><strong>Date & Time:</strong> {selectedEvent.date} ({selectedEvent.time || 'All Day'})</div>
            <div><strong>Venue:</strong> {selectedEvent.venue || 'TBD'}</div>
            <div><strong>Expected Guests:</strong> {selectedEvent.people || selectedEvent.guests || 100}</div>
            <div><strong>Budget:</strong> ${selectedEvent.budget || 'N/A'}</div>
            <div><strong>Notes / Description:</strong> {selectedEvent.notes || selectedEvent.description || 'None provided.'}</div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
};
