import React, { useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Input, Button } from '../../components/common/CommonComponents';
import { issueService } from '../../services/api';

export const VendorReportIssue = () => {
  const [formData, setFormData] = useState({ title: '', category: 'Payment Discrepancy', priority: 'Medium', description: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await issueService.create({ ...formData, reporter: 'Vendor Partner' });
      setSubmitted(true);
      setFormData({ title: '', category: 'Payment Discrepancy', priority: 'Medium', description: '' });
      setTimeout(() => setSubmitted(false), 4000);
    } catch (err) {
      alert('Error submitting issue');
    }
  };

  return (
    <DashboardLayout title="Report Vendor Issue" subtitle="File a ticket regarding client payments, venue access, or dispute">
      <Card title="Vendor Dispute / Support Form" style={{ maxWidth: '600px' }}>
        {submitted && (
          <div style={{ padding: '12px 16px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', color: '#10b981', marginBottom: '20px' }}>
            Vendor ticket logged with superuser administration.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Input label="Subject / Issue Title" placeholder="e.g. Venue door access locked during load-in" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>Issue Category</label>
            <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}>
              <option value="Payment Discrepancy" style={{ background: '#0f172a' }}>Payment Discrepancy</option>
              <option value="Venue Access" style={{ background: '#0f172a' }}>Venue Access</option>
              <option value="Staffing Shortage" style={{ background: '#0f172a' }}>Staffing Shortage</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>Description</label>
            <textarea rows="4" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="State full details..." style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }} required />
          </div>

          <Button type="submit">Submit Ticket</Button>
        </form>
      </Card>
    </DashboardLayout>
  );
};
