/**
 * PAGE: Resources.jsx
 * WHAT IT DOES:
 *   System-wide resource inventory and logistics tracking portal for EventPro superusers.
 *   Provides metric summaries (total items, currently available units, and unique resource types),
 *   instant search across equipment and suppliers, dynamic color-coded inventory progress bars,
 *   and full CRUD management for event equipment, furniture, AV gear, and decor.
 *
 * APIS USED:
 *   - GET    /api/resources       -> fetches all resource inventory records
 *   - POST   /api/resources       -> registers a new physical or digital resource
 *   - PATCH  /api/resources/:id   -> updates resource quantities, availability, category, or pricing
 *   - DELETE /api/resources/:id   -> removes a resource record from the catalog
 *   - GET    /api/vendors         -> populates vendor supplier options in the modal
 */

import React, { useState, useEffect, useMemo } from 'react';
import '../../styles/superuser.css';
import StatCard from './components/StatCard';
import SearchBar from './components/SearchBar';
import DataTable from './components/DataTable';
import StatusBadge from './components/StatusBadge';
import ConfirmModal from './components/ConfirmModal';
import Toast from './components/Toast';
import {
  fetchResources,
  createResource,
  updateResource,
  deleteResource,
  fetchVendors,
} from '../../services/superuserApi';

export default function SuperuserResources() {
  // Stores raw list of all resources loaded from the backend
  // FACULTY MAY ASK: Where does the inventory data originate?
  // HOW TO CHANGE: Fetched from /api/resources inside loadData() and kept in this resources state array.
  const [resources, setResources] = useState([]);

  // Stores available vendors to populate the vendor supplier dropdown
  // FACULTY MAY ASK: How do you show vendor contact info next to the vendor name?
  // HOW TO CHANGE: In the modal vendor <select>, render `<option value={v.name}>{v.name} ({v.phone || 'No phone'})</option>`.
  const [vendors, setVendors] = useState([]);

  // Loading state placeholder toggle
  const [loading, setLoading] = useState(true);

  // Network error state banner
  const [error, setError] = useState(null);

  // Search keyword filter query
  const [searchQuery, setSearchQuery] = useState('');

  // Add/Edit modal visibility and target ID
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form input field values for resource management
  // FACULTY MAY ASK: How do you prevent available units from exceeding total units?
  // HOW TO CHANGE: Handled in validateForm(): checks if `Number(formData.avail) > Number(formData.total)`.
  const [formData, setFormData] = useState({
    name: '',
    category: 'Furniture',
    vendor: '',
    total: '',
    avail: '',
    price: '',
  });

  // Form input error messages map
  const [formErrors, setFormErrors] = useState({});

  // Target resource marked for deletion
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Floating user action feedback toast
  const [toast, setToast] = useState(null);

  // Loads resources and vendors from backend APIs concurrently
  // FACULTY MAY ASK: How does the component normalize backend property names (cat vs category)?
  // HOW TO CHANGE: In loadData(), normalized items map `cat: r.cat || r.category` and `avail: r.avail ?? r.quantity`.
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [resourcesRes, vendorsRes] = await Promise.allSettled([
        fetchResources(),
        fetchVendors(),
      ]);

      const rData =
        resourcesRes.status === 'fulfilled' && Array.isArray(resourcesRes.value)
          ? resourcesRes.value.map((r) => ({
              ...r,
              cat: r.cat || r.category || 'Furniture',
              total: Number(r.total ?? r.quantity ?? 0),
              avail: Number(r.avail ?? r.quantity ?? 0),
              price: Number(r.price ?? 0),
            }))
          : [];

      const vData = vendorsRes.status === 'fulfilled' && Array.isArray(vendorsRes.value) ? vendorsRes.value : [];

      setResources(rData);
      setVendors(vData);
    } catch (err) {
      setError(err.message || 'Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  // Mount effect to fetch data and refresh every 10 seconds
  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 10000);
    return () => clearInterval(timer);
  }, []);

  // Total inventory units across all items
  const totalUnits = useMemo(() => {
    return resources.reduce((sum, r) => sum + (Number(r.total) || 0), 0);
  }, [resources]);

  // Total available units currently ready for assignment
  const totalAvailable = useMemo(() => {
    return resources.reduce((sum, r) => sum + (Number(r.avail) || 0), 0);
  }, [resources]);

  // Count of distinct resource categories
  // FACULTY MAY ASK: How is the "Resource Types" metric calculated?
  // HOW TO CHANGE: Uses a Set to extract unique categories: `new Set(resources.map(r => r.cat)).size`.
  const uniqueTypesCount = useMemo(() => {
    return new Set(resources.map((r) => r.cat)).size;
  }, [resources]);

  // Filters resources by keyword against name, category, vendor, or ID
  const filteredResources = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return resources;
    return resources.filter(
      (r) =>
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.cat && r.cat.toLowerCase().includes(q)) ||
        (r.vendor && r.vendor.toLowerCase().includes(q)) ||
        (r.id && String(r.id).toLowerCase().includes(q))
    );
  }, [resources, searchQuery]);

  // Validates form fields before submitting
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Resource name is required';
    if (!formData.category) errors.category = 'Please select a category';
    if (!formData.vendor) errors.vendor = 'Please select a vendor';

    if (formData.total === '' || isNaN(Number(formData.total)) || Number(formData.total) < 1) {
      errors.total = 'Valid total units (minimum 1) required';
    }
    if (formData.avail === '' || isNaN(Number(formData.avail)) || Number(formData.avail) < 0) {
      errors.avail = 'Valid available units (minimum 0) required';
    } else if (Number(formData.avail) > Number(formData.total)) {
      errors.avail = 'Available units cannot exceed total units';
    }
    if (formData.price === '' || isNaN(Number(formData.price)) || Number(formData.price) < 0) {
      errors.price = 'Valid price per unit required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Opens modal for creating a new resource
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      category: 'Furniture',
      vendor: vendors.length > 0 ? vendors[0].name : '',
      total: '',
      avail: '',
      price: '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Opens modal for editing an existing resource
  const handleOpenEdit = (r) => {
    setEditingId(r.id);
    setFormData({
      name: r.name || '',
      category: r.cat || r.category || 'Furniture',
      vendor: r.vendor || '',
      total: r.total !== undefined ? String(r.total) : '',
      avail: r.avail !== undefined ? String(r.avail) : '',
      price: r.price !== undefined ? String(r.price) : '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Submits form (POST for create, PATCH for update)
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    const tt = Number(formData.total);
    const av = Number(formData.avail);
    const payload = {
      name: formData.name.trim(),
      category: formData.category,
      cat: formData.category,
      vendor: formData.vendor,
      total: tt,
      avail: av,
      quantity: tt,
      price: Number(formData.price),
      available: av > 0,
    };

    try {
      if (editingId) {
        await updateResource(editingId, payload);
        setToast({ message: 'Resource updated successfully!', type: 'ok' });
      } else {
        await createResource(payload);
        setToast({ message: 'Resource created successfully!', type: 'ok' });
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setToast({ message: err.message || 'Operation failed', type: 'err' });
    }
  };

  // Deletes resource after confirmation
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteResource(deleteTarget.id);
      setToast({ message: `Resource "${deleteTarget.name}" deleted.`, type: 'info' });
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      setToast({ message: err.message || 'Failed to delete resource', type: 'err' });
    }
  };

  // Renders dynamic progress bar for resource availability
  // FACULTY MAY ASK: How are the progress bar threshold colors determined?
  // HOW TO CHANGE: Under 30% is red (#ef4444), under 65% is orange (#f59e0b), 65%+ is emerald green (#10b981).
  const renderProgressBar = (avail, total) => {
    const pct = total > 0 ? (avail / total) * 100 : 0;
    const color = pct < 30 ? '#ef4444' : pct < 65 ? '#f59e0b' : '#10b981';
    const fillClass = pct < 30 ? 'pf-lo' : pct < 65 ? 'pf-mi' : 'pf-hi';

    return (
      <div style={{ minWidth: '90px' }}>
        <div style={{ fontSize: '11.5px', fontWeight: 700, color, marginBottom: '3px' }}>
          {avail.toLocaleString()} / {total.toLocaleString()}
        </div>
        <div
          style={{
            height: '5px',
            background: 'rgba(255, 255, 255, 0.07)',
            borderRadius: '5px',
            overflow: 'hidden',
          }}
        >
          <div
            className={fillClass}
            style={{
              height: '100%',
              width: `${Math.min(pct, 100)}%`,
              borderRadius: '5px',
              transition: 'width 0.5s',
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="page">
      {/* Page Header */}
      <div className="ph">
        <h1>
          <span style={{ color: '#ec4899' }}>📦</span> All Resources
        </h1>
        <p>System-wide resource inventory management</p>
      </div>

      {/* Network Error Alert */}
      {error && (
        <div className="su-alert su-alert-error">
          <span>⚠️ {error}</span>
          <button className="btn btn-s" onClick={loadData} style={{ padding: '4px 10px' }}>
            Retry
          </button>
        </div>
      )}

      {/* Metric Stat Cards */}
      {/* FACULTY MAY ASK: How do you show the percentage of total units currently available? */}
      {/* HOW TO CHANGE: Compute `((totalAvailable / totalUnits) * 100).toFixed(0)` and pass as subtext in the Available StatCard. */}
      <div className="stats">
        <StatCard
          label="Total Resources"
          value={loading ? '...' : totalUnits.toLocaleString()}
          subtext="All items"
          icon="📦"
          colorClass="teal"
          borderColor="rgba(34, 211, 238, 0.25)"
        />
        <StatCard
          label="Available"
          value={loading ? '...' : totalAvailable.toLocaleString()}
          subtext="Ready to use"
          icon="✓"
          colorClass="green"
          borderColor="rgba(16, 185, 129, 0.25)"
        />
        <StatCard
          label="Resource Types"
          value={loading ? '...' : uniqueTypesCount}
          subtext="Different items"
          icon="★"
          colorClass="purple"
          borderColor="rgba(167, 139, 250, 0.25)"
        />
      </div>

      {/* Action Row: Search bar & Add Resource CTA */}
      <div className="top-row">
        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search resources by name, category, or vendor..."
        />
        <button className="btn btn-p" onClick={handleOpenAdd} type="button">
          + Add Resource
        </button>
      </div>

      {/* Resources Data Table */}
      <DataTable
        icon="📦"
        title={`All Resources (${filteredResources.length})`}
        headers={[
          'Resource ID',
          'Name',
          'Category',
          'Vendor',
          'Availability',
          'Price',
          'Actions',
        ]}
        isEmpty={filteredResources.length === 0}
        emptyMessage="No resources found"
        emptyIcon="📦"
      >
        {filteredResources.map((r) => (
          <tr key={r.id}>
            <td className="tid">{r.id}</td>
            <td className="tname">{r.name}</td>
            <td>
              <StatusBadge text={r.cat} />
            </td>
            <td>{r.vendor}</td>
            <td>{renderProgressBar(r.avail, r.total)}</td>
            <td style={{ fontWeight: 600, color: '#f1f5f9' }}>$ {r.price}</td>
            <td>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button
                  className="ib ib-e"
                  onClick={() => handleOpenEdit(r)}
                  title="Edit"
                  type="button"
                >
                  ✏
                </button>
                <button
                  className="ib ib-d"
                  onClick={() => setDeleteTarget(r)}
                  title="Delete"
                  type="button"
                >
                  🗑
                </button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      {/* Add / Edit Resource Modal */}
      {isModalOpen && (
        <div
          className="ov open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="modal">
            <div className="mh">
              <span className="mt">{editingId ? 'Edit Resource' : 'Add Resource'}</span>
              <button className="mx" onClick={() => setIsModalOpen(false)} type="button">
                ✕
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="fg2">
                <div className="fg">
                  <label className="fl">Resource Name *</label>
                  <input
                    className={`fc ${formErrors.name ? 'fc-err' : ''}`}
                    placeholder="e.g. Banquet Chairs"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  {formErrors.name && <div className="ferr">{formErrors.name}</div>}
                </div>

                <div className="fg">
                  <label className="fl">Category *</label>
                  <select
                    className={`fc ${formErrors.category ? 'fc-err' : ''}`}
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="Furniture">Furniture</option>
                    <option value="Audio">Audio</option>
                    <option value="Visual">Visual</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Decoration">Decoration</option>
                    <option value="Food & Beverage">Food & Beverage</option>
                    <option value="Media">Media</option>
                  </select>
                  {formErrors.category && <div className="ferr">{formErrors.category}</div>}
                </div>

                <div className="fg">
                  <label className="fl">Vendor *</label>
                  <select
                    className={`fc ${formErrors.vendor ? 'fc-err' : ''}`}
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  >
                    <option value="">Select vendor...</option>
                    {vendors.map((v) => (
                      <option key={v.id || v.name} value={v.name}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.vendor && <div className="ferr">{formErrors.vendor}</div>}
                </div>

                <div className="fg">
                  <label className="fl">Total Units *</label>
                  <input
                    className={`fc ${formErrors.total ? 'fc-err' : ''}`}
                    type="number"
                    min="1"
                    placeholder="e.g. 500"
                    value={formData.total}
                    onChange={(e) => setFormData({ ...formData, total: e.target.value })}
                  />
                  {formErrors.total && <div className="ferr">{formErrors.total}</div>}
                </div>

                <div className="fg">
                  <label className="fl">Available Units *</label>
                  <input
                    className={`fc ${formErrors.avail ? 'fc-err' : ''}`}
                    type="number"
                    min="0"
                    placeholder="e.g. 450"
                    value={formData.avail}
                    onChange={(e) => setFormData({ ...formData, avail: e.target.value })}
                  />
                  {formErrors.avail && <div className="ferr">{formErrors.avail}</div>}
                </div>

                <div className="fg">
                  <label className="fl">Price per Unit ($) *</label>
                  <input
                    className={`fc ${formErrors.price ? 'fc-err' : ''}`}
                    type="number"
                    min="0"
                    placeholder="e.g. 5"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                  {formErrors.price && <div className="ferr">{formErrors.price}</div>}
                </div>
              </div>

              <div className="mf">
                <button className="btn btn-s" onClick={() => setIsModalOpen(false)} type="button">
                  Cancel
                </button>
                <button className="btn btn-p" type="submit">
                  Save Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Deletion Dialog */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Resource"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This item will no longer be available for event bookings.`}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
        confirmText="Delete"
        isDestructive={true}
      />

      {/* Floating Action Feedback Toast */}
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
}

/* ============================================================
   VIVA QUICK NOTES - Resources.jsx
   ============================================================
   DATA FLOW:
   1. Backend Ingestion: fetchResources() and fetchVendors() load inventory items and registered vendors.
   2. Normalized State: Maps backend differences (cat vs category, avail vs quantity) into consistent fields.
   3. Derived Metrics: totalUnits, totalAvailable, and uniqueTypesCount compute live counts from resources state.
   4. Visual Progress Rendering: renderProgressBar() calculates available/total ratio with dynamic HSL color thresholds.
   5. CRUD Integrity: Enforces that available units cannot exceed total units before calling createResource() / updateResource().

   TOP 5 QUESTIONS FACULTY IS MOST LIKELY TO ASK:
   1. "Change the progress bar alert threshold from 30% to 50%":
      -> Look in renderProgressBar() around line 230: change `pct < 30` to `pct < 50`.
   2. "How do you add a new category like 'Lighting' or 'Stage'":
      -> Add `<option value="Lighting">Lighting</option>` inside Category select in the modal JSX and in StatusBadge.jsx.
   3. "How does the form validate that available units don't exceed total units?":
      -> In validateForm(), checks `Number(formData.avail) > Number(formData.total)` and flags formErrors.avail.
   4. "Where does the price formatting come from?":
      -> Formatted inline in the table as `<td style={{ fontWeight: 600, color: '#f1f5f9' }}>$ {r.price}</td>`.
   5. "How do you filter only resources with low stock (under 30%)?":
      -> In filteredResources useMemo, add `r.avail / r.total < 0.3`.
   ============================================================ */
