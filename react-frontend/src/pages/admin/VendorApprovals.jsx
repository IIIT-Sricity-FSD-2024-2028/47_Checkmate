import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Table, Button, Modal, LoadingSpinner } from '../../components/common/CommonComponents';
import { vendorService } from '../../services/api';

export const VendorApprovals = () => {
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchVendors = async () => {
    try {
      const data = await vendorService.getApplications();
      setVendors(data || []);
    } catch (e) {
      console.error('Error fetching vendor applications:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleDecision = async (id, status) => {
    try {
      await vendorService.decideApplication(id, status);
      setSelectedVendor(null);
      fetchVendors();
    } catch (e) {
      alert('Error updating application decision: ' + e.message);
    }
  };

  const filtered = vendors.filter((v) => {
    const matchesQuery = (v.vendorName || '').toLowerCase().includes(search.toLowerCase()) ||
                         (v.businessName || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <DashboardLayout title="Vendor Approvals" subtitle="Review and verify new vendor applications">
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search vendors or business name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
        >
          <option value="all" style={{ background: '#0f172a' }}>All Statuses</option>
          <option value="pending" style={{ background: '#0f172a' }}>Pending</option>
          <option value="approved" style={{ background: '#0f172a' }}>Approved</option>
          <option value="rejected" style={{ background: '#0f172a' }}>Rejected</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading vendor applications..." />
      ) : (
        <Card title={`Applications (${filtered.length})`}>
          <Table headers={['Vendor Name', 'Business Name', 'Email', 'Phone', 'Documents', 'Status', 'Action']}>
            {filtered.map((v) => (
              <tr key={v.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{v.vendorName}</td>
                <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{v.businessName}</td>
                <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{v.email}</td>
                <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{v.phone}</td>
                <td style={{ padding: '12px 16px' }}>{v.documents?.length || 0} files</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    background: v.status === 'approved' ? 'rgba(16,185,129,0.15)' : v.status === 'rejected' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                    color: v.status === 'approved' ? '#10b981' : v.status === 'rejected' ? '#f87171' : '#f59e0b'
                  }}>
                    {v.status || 'pending'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <Button variant="outline" size="small" onClick={() => setSelectedVendor(v)}>
                    Review Application
                  </Button>
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      {selectedVendor && (
        <Modal
          isOpen={!!selectedVendor}
          onClose={() => setSelectedVendor(null)}
          title={`Review ${selectedVendor.businessName}`}
          footer={
            <>
              <Button variant="secondary" onClick={() => setSelectedVendor(null)}>Close</Button>
              {selectedVendor.status === 'pending' && (
                <>
                  <Button variant="danger" onClick={() => handleDecision(selectedVendor.id, 'rejected')}>Reject</Button>
                  <Button variant="primary" onClick={() => handleDecision(selectedVendor.id, 'approved')}>Approve Vendor</Button>
                </>
              )}
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: '#cbd5e1' }}>
            <div><strong>Vendor Contact:</strong> {selectedVendor.vendorName}</div>
            <div><strong>Email:</strong> {selectedVendor.email}</div>
            <div><strong>Phone:</strong> {selectedVendor.phone}</div>
            <div><strong>Category:</strong> {selectedVendor.category || 'General Services'}</div>
            <div>
              <strong>Uploaded Verification Documents:</strong>
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {(selectedVendor.documents || []).length === 0 ? (
                  <span style={{ color: '#64748b' }}>No documents uploaded.</span>
                ) : (
                  (selectedVendor.documents || []).map((doc, i) => (
                    <div key={i} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>📄 {doc.name || 'Document'}</span>
                      <span style={{ color: '#ec4899' }}>{doc.type || 'PDF'}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
};
