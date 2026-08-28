import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Table, LoadingSpinner } from '../../components/common/CommonComponents';
import { vendorService } from '../../services/api';

export const SuperuserResources = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const data = await vendorService.getResources();
        setResources(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, []);

  return (
    <DashboardLayout title="Superuser Resource Master" subtitle="All inventory assets registered across all vendors">
      {loading ? (
        <LoadingSpinner message="Querying master resources..." />
      ) : (
        <Card title={`Master Resources (${resources.length})`}>
          <Table headers={['Asset ID', 'Name', 'Category', 'Quantity', 'Rental Price']}>
            {resources.map((r) => (
              <tr key={r.id || r.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px 16px', fontSize: '12px', color: '#94a3b8' }}>{r.id}</td>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{r.name}</td>
                <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{r.category || r.cat}</td>
                <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{r.quantity || r.total || 0}</td>
                <td style={{ padding: '12px 16px', color: '#ec4899', fontWeight: 600 }}>${r.price} / {r.unit || 'day'}</td>
              </tr>
            ))}
          </Table>
        </Card>
      )}
    </DashboardLayout>
  );
};
