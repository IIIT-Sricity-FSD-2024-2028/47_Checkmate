/**
 * ============================================================================
 * CLIENT BROWSE PACKAGES (BrowsePackages.jsx)
 * ============================================================================
 * Role: Client Portal
 * Location: src/pages/client/BrowsePackages.jsx
 *
 * Purpose:
 *   Browse curated event packages offered by verified vendors:
 *     - Fetches approved packages from /api/packages
 *     - Category filters (All, Wedding, Birthday, Conference, Corporate)
 *     - Live search by package name, features, or vendor
 *     - Quick Create Modal: instantiates an event immediately with pre-filled package specs
 * ============================================================================
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  Users,
  X,
  PlusCircle,
  Building2,
  Filter,
} from 'lucide-react';

import '../../styles/client.css';
import { getPackages } from '../../services/packageService';
import { createEvent } from '../../services/eventService';
import { getAuthSession, getAuthUser } from '../../services/auth/authStorage';

const CATEGORY_IMAGES = {
  wedding: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  birthday: 'https://images.unsplash.com/photo-1530103862676-de88b7280eb4?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  conference: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  corporate: 'https://images.unsplash.com/photo-1515169067868-5387ec356754?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  party: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
};

const CATEGORY_BADGES = {
  wedding: 'badge--wedding',
  birthday: 'badge--birthday',
  conference: 'badge--conference',
  corporate: 'badge--corporate',
};

export default function ClientBrowsePackages() {
  const navigate = useNavigate();
  const session = getAuthSession();
  const user = getAuthUser() || session?.user || {};

  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Create Modal
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [qcEventName, setQcEventName] = useState('');
  const [qcEventDate, setQcEventDate] = useState('');
  const [qcEventTime, setQcEventTime] = useState('14:00');
  const [qcVenue, setQcVenue] = useState('');
  const [qcPeople, setQcPeople] = useState(100);
  const [submittingQc, setSubmittingQc] = useState(false);

  // Load packages
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const pkgs = await getPackages();
        if (mounted) {
          // Filter out rejected packages
          const valid = (Array.isArray(pkgs) ? pkgs : []).filter(
            (p) => String(p.status || '').toLowerCase() !== 'rejected'
          );
          setPackages(valid);
        }
      } catch (err) {
        console.error('Failed to load packages:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  // Filtered packages
  const filteredPackages = useMemo(() => {
    return packages.filter((p) => {
      const cat = String(p.category || '').toLowerCase();
      const matchCat =
        activeCategory === 'all' || cat === activeCategory.toLowerCase();

      if (!matchCat) return false;

      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        String(p.name || '').toLowerCase().includes(q) ||
        String(p.desc || '').toLowerCase().includes(q) ||
        cat.includes(q)
      );
    });
  }, [packages, activeCategory, searchQuery]);

  // Handle opening modal
  const handleOpenQuickCreate = (pkg) => {
    setSelectedPkg(pkg);
    setQcEventName(`${pkg.name} Event`);
    setQcPeople(pkg.capacity || 100);
    setQcVenue('Grand Hotel Ballroom');
    // Set date to 14 days from now by default
    const d = new Date();
    d.setDate(d.getDate() + 14);
    setQcEventDate(d.toISOString().slice(0, 10));
  };

  // Submit quick create
  const handleSubmitQuickCreate = async (e) => {
    e.preventDefault();
    if (!qcEventName.trim() || !qcEventDate || !qcVenue.trim()) {
      alert('Please fill out all required fields.');
      return;
    }

    try {
      setSubmittingQc(true);

      const targetVendor = selectedPkg.vendor || 'Elite Events Co.';
      const targetVendorId = selectedPkg.vendorId || 'V001';

      const payload = {
        name: qcEventName.trim(),
        type: selectedPkg.category || 'Conference',
        date: qcEventDate,
        time: qcEventTime,
        venue: qcVenue.trim(),
        people: parseInt(qcPeople, 10) || selectedPkg.capacity || 1,
        guests: parseInt(qcPeople, 10) || selectedPkg.capacity || 1,
        status: 'pending',
        notes: `Instantiated from package: ${selectedPkg.name} (${selectedPkg.id || 'Custom'})`,
        createdBy: 'client',
        client: user.name || session?.name || 'Emily Carter',
        clientId: user.id || session?.userId || 'U004',
        clientEmail: user.email || session?.email || 'emily.client@example.com',
        vendor: targetVendor,
        vendorId: targetVendorId,
        vendors: [targetVendor],
        vendorIds: [targetVendorId],
        budget: selectedPkg.price || 5000,
        budgetRange: `$${(selectedPkg.price || 5000).toLocaleString()}`,
        estimatedCost: selectedPkg.price || 5000,
        packageId: selectedPkg.id,
        packageName: selectedPkg.name,
        submittedAt: new Date().toISOString(),
      };

      await createEvent(payload);
      alert(`Event "${qcEventName}" created successfully! Check My Events to track feasibility.`);
      setSelectedPkg(null);
      navigate('/client/events');
    } catch (err) {
      alert(`Error creating event from package: ${err.message}`);
    } finally {
      setSubmittingQc(false);
    }
  };

  return (
    <div className="client-content-wrap">
      {/* Title */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Browse Event Packages
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
          Explore all-inclusive packages curated by leading verified vendors.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card mb-6"
        style={{
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div className="search-box" style={{ flex: 1, minWidth: '240px' }}>
          <Search size={14} className="search-icon" />
          <input
            type="text"
            placeholder="Search packages by title, features, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['all', 'wedding', 'birthday', 'conference', 'corporate'].map((cat) => (
            <button
              key={cat}
              type="button"
              className={`btn ${activeCategory === cat ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '6px 14px', fontSize: '12px', textTransform: 'capitalize' }}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Packages Grid */}
      <div className="packages-grid">
        {loading ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            Loading packages catalog...
          </div>
        ) : filteredPackages.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            No packages found matching your criteria.
          </div>
        ) : (
          filteredPackages.map((p) => {
            const cat = String(p.category || 'party').toLowerCase();
            const imgUrl = CATEGORY_IMAGES[cat] || CATEGORY_IMAGES.party;
            const badgeClass = CATEGORY_BADGES[cat] || 'badge--wedding';

            return (
              <div key={p.id} className="package-card">
                <div className="package-img">
                  <img src={imgUrl} alt={p.name} />
                </div>

                <div className="package-body">
                  <span className={`badge ${badgeClass}`} style={{ width: 'max-content', fontWeight: 600 }}>
                    {p.category || 'Package'}
                  </span>
                  <h3 className="package-title">{p.name}</h3>
                  <p className="package-desc">{p.desc}</p>

                  <div className="package-included">
                    <h4>Included Services:</h4>
                    <ul>
                      {Array.isArray(p.resources) && p.resources.length > 0 ? (
                        p.resources.map((r, i) => <li key={i}>{typeof r === 'object' ? r.name : r}</li>)
                      ) : (
                        <li>Standard Audiovisual & Staging Setup</li>
                      )}
                    </ul>

                    <h4>Staff Included:</h4>
                    <ul>
                      {Array.isArray(p.staff) && p.staff.length > 0 ? (
                        p.staff.map((s, i) => <li key={i}>{typeof s === 'object' ? s.name : s}</li>)
                      ) : (
                        <li>Dedicated Event Coordinator & Tech Lead</li>
                      )}
                    </ul>
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: '18px' }}>
                    <div className="package-price">${(p.price || 0).toLocaleString()}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                      {p.duration || 6} Hours • Up to {p.capacity || 150} Guests
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleOpenQuickCreate(p)}
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      <Zap size={14} style={{ marginRight: '6px' }} /> Quick Create Event
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Create Modal */}
      {selectedPkg && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target.classList.contains('modal-overlay')) setSelectedPkg(null);
          }}
        >
          <div
            className="card"
            style={{
              width: 'min(500px, 94vw)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                paddingBottom: '14px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Quick Create from Package
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--pink)', marginTop: '2px' }}>
                  {selectedPkg.name} (${(selectedPkg.price || 0).toLocaleString()})
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPkg(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitQuickCreate}>
              <div className="form-group mb-4">
                <label>Event Title *</label>
                <input
                  type="text"
                  className="form-control"
                  value={qcEventName}
                  onChange={(e) => setQcEventName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={qcEventDate}
                    onChange={(e) => setQcEventDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Time</label>
                  <input
                    type="time"
                    className="form-control"
                    value={qcEventTime}
                    onChange={(e) => setQcEventTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group mb-4">
                <label>Venue Location *</label>
                <input
                  type="text"
                  className="form-control"
                  value={qcVenue}
                  onChange={(e) => setQcVenue(e.target.value)}
                  placeholder="e.g. Grand Hotel Ballroom"
                  required
                />
              </div>

              <div className="form-group mb-6">
                <label>Guest Count</label>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  value={qcPeople}
                  onChange={(e) => setQcPeople(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedPkg(null)}
                  disabled={submittingQc}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingQc}
                  style={{ background: 'linear-gradient(135deg, var(--pink), #db2777)' }}
                >
                  {submittingQc ? 'Creating Event...' : 'Confirm & Create Event ⚡'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
