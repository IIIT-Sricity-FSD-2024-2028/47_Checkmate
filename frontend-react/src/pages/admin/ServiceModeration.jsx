import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, AlertOctagon, CheckCircle2, XCircle, Eye, 
  Search, Filter, RefreshCcw, X, Package, DollarSign, Store
} from 'lucide-react';
import { getPackages, decidePackage } from '../../services/packageService';
import '../../styles/admin.css';

export default function ServiceModeration() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const data = await getPackages();
      setPackages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load packages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  // Compute stat counts
  const stats = useMemo(() => {
    let pending = 0, approved = 0, rejected = 0;
    packages.forEach((p) => {
      const s = (p.status || 'pending').toLowerCase();
      if (s === 'pending') pending++;
      else if (s === 'approved') approved++;
      else if (s === 'rejected') rejected++;
    });
    return { pending, approved, rejected };
  }, [packages]);

  // Filtering
  const filteredPackages = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return packages.filter((p) => {
      const matchesSearch =
        !q ||
        (p.id && p.id.toLowerCase().includes(q)) ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.vendorName && p.vendorName.toLowerCase().includes(q)) ||
        (p.vendorId && p.vendorId.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q));

      const s = (p.status || 'pending').toLowerCase();
      let matchesStatus = true;
      if (statusFilter !== 'all') {
        matchesStatus = s === statusFilter.toLowerCase();
      }

      return matchesSearch && matchesStatus;
    });
  }, [packages, searchTerm, statusFilter]);

  const handleDecision = async (pkgId, newStatus) => {
    try {
      setActionLoading(true);
      await decidePackage(pkgId, { status: newStatus });
      await fetchPackages();
      if (selectedPkg && selectedPkg.id === pkgId) {
        setSelectedPkg(null);
      }
    } catch (err) {
      console.error('Failed to moderate package:', err);
      alert('Failed to update service status.');
    } finally {
      setActionLoading(false);
    }
  };

  const renderBadge = (status) => {
    const s = (status || 'pending').toLowerCase();
    if (s === 'approved') {
      return (
        <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '600', background: 'rgba(0, 230, 118, 0.15)', color: '#00e676' }}>
          Approved
        </span>
      );
    }
    if (s === 'rejected') {
      return (
        <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '600', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
          Rejected
        </span>
      );
    }
    return (
      <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '600', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
        Pending Moderation
      </span>
    );
  };

  return (
    <div className="admin-page-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#fff', margin: 0 }}>Service & Package Moderation</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
          Review and approve custom vendor packages before they become available on the marketplace.
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Pending Moderation</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <Package size={18} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '700', color: '#f59e0b', marginTop: '10px' }}>
            {stats.pending}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Awaiting admin audit
          </div>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Approved Packages</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(0, 230, 118, 0.1)', color: '#00e676' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '700', color: '#00e676', marginTop: '10px' }}>
            {stats.approved}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Live on marketplace
          </div>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Terminated / Rejected</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              <XCircle size={18} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '700', color: '#ef4444', marginTop: '10px' }}>
            {stats.rejected}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Delisted from catalog
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '300px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by package name, vendor, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '9px 12px',
              background: '#161922',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <button
          onClick={fetchPackages}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '9px 14px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          <RefreshCcw size={14} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {/* Packages Table */}
      <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCcw size={28} className="spin" style={{ margin: '0 auto 12px auto', display: 'block' }} />
            Loading packages...
          </div>
        ) : filteredPackages.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No packages match your search filters.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Package Name</th>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Vendor</th>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Price</th>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Inclusions</th>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '14px 16px', fontWeight: '600', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPackages.map((pkg) => {
                const s = (pkg.status || 'pending').toLowerCase();
                const isPending = s === 'pending';
                const isApproved = s === 'approved';
                const isRejected = s === 'rejected';
                const inclusionsCount = (pkg.resources || []).length + (pkg.staff || []).length;

                return (
                  <tr key={pkg.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 16px', color: '#fff', fontWeight: '600' }}>
                      <div>{pkg.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{pkg.category || 'Event Package'}</div>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                      {pkg.vendorName || pkg.vendor || pkg.vendorId || 'Elite Events Co.'}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#00e676', fontWeight: '600' }}>
                      ${Number(pkg.price || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                      {inclusionsCount} items included
                    </td>
                    <td style={{ padding: '14px 16px' }}>{renderBadge(pkg.status)}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setSelectedPkg(pkg)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 10px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            color: '#fff',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          <Eye size={13} /> Review
                        </button>

                        {(isPending || isRejected) && (
                          <button
                            disabled={actionLoading}
                            onClick={() => handleDecision(pkg.id, 'approved')}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 10px',
                              background: 'rgba(0, 230, 118, 0.15)',
                              border: '1px solid rgba(0, 230, 118, 0.4)',
                              borderRadius: '6px',
                              color: '#00e676',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                            }}
                          >
                            <CheckCircle2 size={13} /> Approve
                          </button>
                        )}

                        {(isPending || isApproved) && (
                          <button
                            disabled={actionLoading}
                            onClick={() => handleDecision(pkg.id, 'rejected')}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 10px',
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.4)',
                              borderRadius: '6px',
                              color: '#ef4444',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                            }}
                          >
                            <XCircle size={13} /> {isApproved ? 'Terminate' : 'Reject'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Package Review Modal */}
      {selectedPkg && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={() => setSelectedPkg(null)}
        >
          <div
            style={{
              background: '#12141c',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              width: '100%',
              maxWidth: '650px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPkg(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#fff', margin: 0 }}>
                {selectedPkg.name}
              </h2>
              {renderBadge(selectedPkg.status)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Vendor / Provider</div>
                <div style={{ fontSize: '14px', color: '#fff', fontWeight: '600', marginTop: '2px' }}>
                  {selectedPkg.vendorName || selectedPkg.vendor || selectedPkg.vendorId || 'Elite Events Co.'}
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pricing</div>
                <div style={{ fontSize: '16px', color: '#00e676', fontWeight: '700', marginTop: '2px' }}>
                  ${Number(selectedPkg.price || 0).toLocaleString()}
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Description
              </div>
              <div style={{ fontSize: '13.5px', color: '#fff', lineHeight: '1.5' }}>
                {selectedPkg.description || 'Full-service event production bundle with premium audio visual resources and certified staff.'}
              </div>
            </div>

            {/* Inclusions */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Included Equipment & Staff
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {Array.isArray(selectedPkg.resources) && selectedPkg.resources.length > 0 ? (
                  selectedPkg.resources.map((r, i) => (
                    <span key={i} style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', fontSize: '12px', color: '#fff', border: '1px solid var(--border)' }}>
                      📦 {typeof r === 'string' ? r : r.name || r.resourceName}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Default audio-visual and stage lighting</span>
                )}
                {Array.isArray(selectedPkg.staff) && selectedPkg.staff.map((s, i) => (
                  <span key={'s' + i} style={{ padding: '4px 10px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '6px', fontSize: '12px', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                    👤 {typeof s === 'string' ? s : s.role || s.staffName}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setSelectedPkg(null)}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>

              <button
                disabled={actionLoading}
                onClick={() => handleDecision(selectedPkg.id, 'rejected')}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '8px',
                  color: '#ef4444',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Reject / Terminate
              </button>

              <button
                disabled={actionLoading}
                onClick={() => handleDecision(selectedPkg.id, 'approved')}
                style={{
                  padding: '8px 16px',
                  background: '#00e676',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#000',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Approve Service
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
