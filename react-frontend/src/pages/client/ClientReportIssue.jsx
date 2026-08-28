import React, { useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Input, Button } from '../../components/common/CommonComponents';
import { issueService } from '../../services/api';

export const ClientReportIssue = () => {
  const [formData, setFormData] = useState({ title: '', category: 'Catering', priority: 'Medium', description: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await issueService.create({ ...formData, reporter: 'Client User' });
      setSubmitted(true);
      setFormData({ title: '', category: 'Catering', priority: 'Medium', description: '' });
      setTimeout(() => setSubmitted(false), 4000);
    } catch (err) {
      alert('Error submitting issue');
    }
  };

  return (
    <DashboardLayout title="Report Event Issue" subtitle="File a support or grievance ticket regarding event execution">
      <Card title="Grievance Ticket Form" style={{ maxWidth: '600px' }}>
        {submitted && (
          <div style={{ padding: '12px 16px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', color: '#10b981', marginBottom: '20px' }}>
            Ticket filed successfully! An admin supervisor will review your issue shortly.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Input label="Issue Subject / Title" placeholder="e.g. Delay in catering delivery" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>Category</label>
              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}>
                <option value="Catering" style={{ background: '#0f172a' }}>Catering</option>
                <option value="Audio/Visual" style={{ background: '#0f172a' }}>Audio/Visual</option>
                <option value="Decor" style={{ background: '#0f172a' }}>Decor</option>
                <option value="Staffing" style={{ background: '#0f172a' }}>Staffing</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>Priority Level</label>
              <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}>
                <option value="Low" style={{ background: '#0f172a' }}>Low</option>
                <option value="Medium" style={{ background: '#0f172a' }}>Medium</option>
                <option value="High" style={{ background: '#0f172a' }}>High / Urgent</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>Detailed Description</label>
            <textarea rows="4" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe what went wrong..." style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }} required />
          </div>

          <Button type="submit">Submit Issue Ticket</Button>
        </form>
      </Card>
    </DashboardLayout>
  );
};
