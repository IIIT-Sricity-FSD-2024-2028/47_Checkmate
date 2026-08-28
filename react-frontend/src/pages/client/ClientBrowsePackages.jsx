import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Button, LoadingSpinner } from '../../components/common/CommonComponents';
import { vendorService } from '../../services/api';

export const ClientBrowsePackages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const data = await vendorService.getPackages();
        setPackages(data || [
          { id: 'PKG-1', name: 'Grand Wedding Suite', category: 'Weddings', price: 4999, capacity: '250 Guests', desc: 'All-inclusive venue decor, gourmet catering & full audiovisual production.' },
          { id: 'PKG-2', name: 'Corporate Summit Pro', category: 'Corporate', price: 2999, capacity: '150 Attendees', desc: 'Stage setup, HD projector, high-speed Wi-Fi & catered coffee breaks.' },
          { id: 'PKG-3', name: 'Gala & Evening Party', category: 'Social', price: 1899, capacity: '100 Guests', desc: 'DJ sound system, ambient LED lighting, bar setup & security staff.' }
        ]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

  return (
    <DashboardLayout title="Browse Preset Event Packages" subtitle="Select pre-configured vendor packages for rapid event booking">
      {loading ? (
        <LoadingSpinner message="Fetching preset packages..." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {packages.map((pkg) => (
            <Card key={pkg.id || pkg.name} title={pkg.name} subtitle={pkg.category}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#ec4899', margin: '12px 0' }}>
                ${pkg.price} <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 400 }}>/ package</span>
              </div>
              <p style={{ color: '#cbd5e1', fontSize: '14px', marginBottom: '16px', minHeight: '40px' }}>
                {pkg.desc || pkg.description}
              </p>
              <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px', display: 'flex', gap: '12px' }}>
                <span>👥 {pkg.capacity}</span>
                <span>⏱️ {pkg.duration || 1} day</span>
              </div>
              <Button style={{ width: '100%' }} onClick={() => navigate('/client/create-event', { state: { packageId: pkg.id, packageName: pkg.name } })}>
                Book This Package &rarr;
              </Button>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};
