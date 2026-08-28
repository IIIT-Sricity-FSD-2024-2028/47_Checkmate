import React, { useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Input, Button } from '../../components/common/CommonComponents';
import { issueService } from '../../services/api';

export const StaffReportIssue = () => {
  const [formData, setFormData] = useState({ title: '', category: 'Equipment Failure', priority: 'High', description: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await issueService.create({ ...formData, reporter: 'Staff Crew Member' });
      setSubmitted(true);
      setFormData({ title: '', category: 'Equipment Failure', priority: 'High', description: '' });
      setTimeout(() => setSubmitted(false), 4000);
    } catch (err) {
      alert('Error submitting report');
    }
  };

  return (
    <DashboardLayout title="Report On-Site Equipment or Logistics Incident" subtitle="Alert vendor leads and admin about technical faults">
      <Card title="Incident Report Form" style={{ maxWidth: '600px' }}>
        {submitted && (
          <div style={{ padding: '12px 16px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', color: '#10b981', marginBottom: '20px' }}>
            Incident report broadcasted to management.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Input label="Incident Title" placeholder="e.g. Broken XLR cable on main stage" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>Incident Type</label>
              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}>
                <option value="Equipment Failure" style={{ background: '#0f172a' }}>Equipment Failure</option>
                <option value="Safety Hazard" style={{ background: '#0f172a' }}>Safety Hazard</option>
                <option value="Schedule Conflict" style={{ background: '#0f172a' }}>Schedule Conflict</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>Urgency Level</label>
              <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}>
                <option value="High" style={{ background: '#0f172a' }}>High / Critical</option>
                <option value="Medium" style={{ background: '#0f172a' }}>Medium</option>
                <option value="Low" style={{ background: '#0f172a' }}>Low</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>Incident Description</label>
            <textarea rows="4" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="State details of the fault or safety issue..." style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }} required />
          </div>

          <Button type="submit">Broadcast Incident Report</Button>
        </form>
      </Card>
    </DashboardLayout>
  );
};
