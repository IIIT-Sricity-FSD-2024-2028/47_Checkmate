import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Input, Button, ErrorMessage } from '../../components/common/CommonComponents';
import { eventService } from '../../services/api';

export const CreateEventClient = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const prefilled = location.state || {};

  const [formData, setFormData] = useState({
    name: prefilled.packageName ? `Booking - ${prefilled.packageName}` : '',
    type: 'Conference',
    date: '',
    time: '10:00',
    venue: '',
    people: 100,
    budget: 5000,
    notes: prefilled.packageId ? `Package Selected: ${prefilled.packageName}` : '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.date || !formData.venue) {
      setError('Please fill in all mandatory event fields.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await eventService.create({
        ...formData,
        status: 'pending',
        createdBy: 'client',
      });
      navigate('/client/my-events');
    } catch (err) {
      setError(err.message || 'Error submitting event request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Create New Event Request" subtitle="Submit your event specification and requirements to vendors">
      <Card title="Event Submission Form" style={{ maxWidth: '680px' }}>
        {error && <ErrorMessage message={error} />}

        <form onSubmit={handleSubmit}>
          <Input
            label="Event Name / Title"
            placeholder="e.g. Annual Tech Conference 2026"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>Event Category</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
              >
                <option value="Conference" style={{ background: '#0f172a' }}>Conference</option>
                <option value="Wedding" style={{ background: '#0f172a' }}>Wedding</option>
                <option value="Birthday" style={{ background: '#0f172a' }}>Birthday Party</option>
                <option value="Gala" style={{ background: '#0f172a' }}>Corporate Gala</option>
                <option value="Exhibition" style={{ background: '#0f172a' }}>Exhibition</option>
              </select>
            </div>

            <Input
              label="Expected Guests Count"
              type="number"
              value={formData.people}
              onChange={(e) => setFormData({ ...formData, people: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="Event Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
            <Input
              label="Start Time"
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            />
          </div>

          <Input
            label="Venue Address / Location"
            placeholder="Grand Horizon Convention Center, Main Hall"
            value={formData.venue}
            onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
            required
          />

          <Input
            label="Target Budget ($)"
            type="number"
            value={formData.budget}
            onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
          />

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>Additional Requirements & Notes</label>
            <textarea
              rows="4"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Specify catering preferences, stage specs, or sound requirements..."
              style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <Button type="submit" disabled={loading} style={{ width: '100%', padding: '12px' }}>
            {loading ? 'Submitting Request...' : 'Submit Event Request'}
          </Button>
        </form>
      </Card>
    </DashboardLayout>
  );
};
