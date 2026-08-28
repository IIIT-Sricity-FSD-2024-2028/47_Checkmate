import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Input, Button, Modal } from '../../components/common/CommonComponents';
import { vendorService } from '../../services/api';

export const VendorPresetPackage = () => {
  const [packages, setPackages] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'Corporate', price: '', capacity: '', desc: '' });

  const fetchPackages = async () => {
    try {
      const data = await vendorService.getPackages();
      setPackages(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await vendorService.createPackage(form);
      setIsModalOpen(false);
      setForm({ name: '', category: 'Corporate', price: '', capacity: '', desc: '' });
      fetchPackages();
    } catch (e) {
      alert('Error creating package');
    }
  };

  return (
    <DashboardLayout title="Preset Event Packages" subtitle="Create and offer packaged event bundles to prospective clients">
      <div style={{ marginBottom: '20px', textAlign: 'right' }}>
        <Button onClick={() => setIsModalOpen(true)}>Create New Package +</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {packages.map((p) => (
          <Card key={p.id || p.name} title={p.name} subtitle={p.category}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#ec4899', margin: '8px 0' }}>${p.price}</div>
            <p style={{ fontSize: '13px', color: '#cbd5e1' }}>{p.desc || p.description}</p>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '12px' }}>Capacity: {p.capacity}</div>
          </Card>
        ))}
      </div>

      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Preset Package">
          <form onSubmit={handleCreate}>
            <Input label="Package Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="Price ($)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            <Input label="Guest Capacity" placeholder="e.g. 200 Guests" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>Description</label>
              <textarea rows="3" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
            </div>
            <Button type="submit" style={{ width: '100%' }}>Publish Package</Button>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
};
