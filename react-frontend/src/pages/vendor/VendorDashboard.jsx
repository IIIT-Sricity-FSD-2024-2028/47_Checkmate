import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Table, LoadingSpinner } from '../../components/common/CommonComponents';
import { vendorService, eventService } from '../../services/api';

export const VendorDashboard = () => {
  const [resources, setResources] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [res, evs] = await Promise.all([
          vendorService.getResources(),
          eventService.getAll(),
        ]);
        setResources(res || []);
        setEvents(evs || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <DashboardLayout title="Vendor Dashboard" subtitle="Manage your event requests, inventory resources, and staff team">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        <Card title="Event Requests" subtitle="Pending Approval" icon={<i className="ph ph-clipboard-text"></i>}>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#ec4899', marginTop: '8px' }}>{events.length}</div>
        </Card>
        <Card title="Total Resources" subtitle="Equipment & Venue Assets" icon={<i className="ph ph-stack"></i>}>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#3b82f6', marginTop: '8px' }}>{resources.length}</div>
        </Card>
        <Card title="Staff Assigned" subtitle="Active Crew" icon={<i className="ph ph-user-list"></i>}>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#10b981', marginTop: '8px' }}>8</div>
        </Card>
      </div>

      <Card title="Resource Inventory Overview">
        {loading ? (
          <LoadingSpinner message="Loading vendor inventory..." />
        ) : (
          <Table headers={['Asset Name', 'Category', 'Quantity Available', 'Price / Unit', 'Status']}>
            {resources.slice(0, 5).map((r) => (
              <tr key={r.id || r.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{r.name}</td>
                <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{r.category || r.cat}</td>
                <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{r.avail ?? r.quantity ?? 0} / {r.total ?? r.quantity ?? 0}</td>
                <td style={{ padding: '12px 16px', color: '#ec4899', fontWeight: 600 }}>${r.price} / {r.unit || 'day'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                    Available
                  </span>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </DashboardLayout>
  );
};
