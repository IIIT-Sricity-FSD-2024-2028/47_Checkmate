import React, { useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Input, Button } from '../../components/common/CommonComponents';

export const AdminSettings = () => {
  const [platformName, setPlatformName] = useState('Checkmate Event Management');
  const [commissionRate, setCommissionRate] = useState('10');
  const [apiEndpoint, setApiEndpoint] = useState('http://localhost:3000/api');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <DashboardLayout title="System Settings" subtitle="Configure system parameters and NestJS connection settings">
      <Card title="Global Platform Configuration">
        {saved && (
          <div style={{ padding: '12px 16px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', color: '#10b981', marginBottom: '20px' }}>
            System settings updated successfully!
          </div>
        )}

        <form onSubmit={handleSave} style={{ maxWidth: '600px' }}>
          <Input
            label="Platform Name"
            value={platformName}
            onChange={(e) => setPlatformName(e.target.value)}
          />
          <Input
            label="Platform Commission Rate (%)"
            type="number"
            value={commissionRate}
            onChange={(e) => setCommissionRate(e.target.value)}
          />
          <Input
            label="NestJS Backend Base API URL"
            value={apiEndpoint}
            onChange={(e) => setApiEndpoint(e.target.value)}
          />

          <Button type="submit" style={{ marginTop: '12px' }}>Save System Settings</Button>
        </form>
      </Card>
    </DashboardLayout>
  );
};
