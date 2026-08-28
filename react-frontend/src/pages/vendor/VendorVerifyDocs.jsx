import React, { useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Input, Button } from '../../components/common/CommonComponents';

export const VendorVerifyDocs = () => {
  const [docs, setDocs] = useState([
    { name: 'Business License 2026.pdf', status: 'Verified' },
    { name: 'Insurance Certificate.pdf', status: 'Pending Review' }
  ]);
  const [fileName, setFileName] = useState('');

  const handleUpload = (e) => {
    e.preventDefault();
    if (!fileName.trim()) return;
    setDocs([...docs, { name: fileName, status: 'Pending Review' }]);
    setFileName('');
  };

  return (
    <DashboardLayout title="Vendor Compliance & Document Verification" subtitle="Upload business licenses and insurance policies for admin approval">
      <Card title="Upload Verification Document" style={{ maxWidth: '500px', marginBottom: '24px' }}>
        <form onSubmit={handleUpload}>
          <Input label="Document Name / Title" placeholder="e.g. Liability Insurance 2026.pdf" value={fileName} onChange={(e) => setFileName(e.target.value)} required />
          <Button type="submit">Submit Document for Review</Button>
        </form>
      </Card>

      <Card title="Submitted Compliance Documents">
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {docs.map((d, i) => (
            <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontWeight: 600, color: '#fff' }}>📄 {d.name}</span>
              <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', background: d.status === 'Verified' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: d.status === 'Verified' ? '#10b981' : '#f59e0b' }}>
                {d.status}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </DashboardLayout>
  );
};
