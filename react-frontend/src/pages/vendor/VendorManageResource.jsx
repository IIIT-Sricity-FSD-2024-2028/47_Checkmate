import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Table, Button, Input, Modal, LoadingSpinner } from '../../components/common/CommonComponents';
import { vendorService } from '../../services/api';

export const VendorManageResource = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'Audio/Visual', quantity: 10, price: 150, unit: 'day' });

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

  useEffect(() => {
    fetchResources();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await vendorService.createResource(form);
      setIsModalOpen(false);
      setForm({ name: '', category: 'Audio/Visual', quantity: 10, price: 150, unit: 'day' });
      fetchResources();
    } catch (e) {
      alert('Error adding resource asset');
    }
  };

  const handleDelete = async (id) => {
    try {
      await vendorService.deleteResource(id);
      fetchResources();
    } catch (e) {
      alert('Error removing asset');
    }
  };

  return (
    <DashboardLayout title="Manage Inventory Resources" subtitle="Add, monitor, and price event equipment and rental assets">
      <div style={{ marginBottom: '20px', textAlign: 'right' }}>
        <Button onClick={() => setIsModalOpen(true)}>Add New Resource Asset +</Button>
      </div>

      {loading ? (
        <LoadingSpinner message="Fetching inventory assets..." />
      ) : (
        <Card title={`Inventory Assets (${resources.length})`}>
          <Table headers={['Asset Name', 'Category', 'Quantity Available', 'Rental Rate', 'Actions']}>
            {resources.map((r) => (
              <tr key={r.id || r.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{r.name}</td>
                <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{r.category || r.cat}</td>
                <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{r.avail ?? r.quantity ?? 0} / {r.total ?? r.quantity ?? 0}</td>
                <td style={{ padding: '12px 16px', color: '#ec4899', fontWeight: 600 }}>${r.price} / {r.unit || 'day'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <Button size="small" variant="danger" onClick={() => handleDelete(r.id)}>Delete</Button>
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Resource Asset">
          <form onSubmit={handleAdd}>
            <Input label="Asset Name" placeholder="e.g. JBL Line Array Speakers" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="Quantity Units" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })} required />
            <Input label="Price Rate ($)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} required />
            <Button type="submit" style={{ width: '100%', marginTop: '12px' }}>Add Asset</Button>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
};
