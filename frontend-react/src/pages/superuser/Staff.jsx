/**
 * PAGE: Staff.jsx
 * WHAT IT DOES:
 *   System-wide staff governance and workforce management portal for EventPro superusers.
 *   Provides platform-wide workforce metrics (total personnel, available for assignment, and active profiles),
 *   keyword search across roles and suppliers, real-time status badges, and complete CRUD management
 *   (adding operational staff, updating vendor assignments/roles/phone/availability, and removing records).
 *
 * APIS USED:
 *   - GET    /api/staff       -> fetches all staff member profiles
 *   - POST   /api/staff       -> registers a new staff profile
 *   - PATCH  /api/staff/:id   -> updates staff role, vendor affiliation, availability, or status
 *   - DELETE /api/staff/:id   -> removes a staff profile from the system
 *   - GET    /api/vendors     -> retrieves active vendors for assignment
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
  fetchStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  fetchVendors,
} from '../../services/superuserApi';

export default function SuperuserStaff() {
  // Stores raw list of all staff personnel loaded from the backend
  // FACULTY MAY ASK: Where does the staff personnel directory originate?
  // HOW TO CHANGE: Fetched from /api/staff inside loadData() and saved in this staff state array.
  const [staff, setStaff] = useState([]);

  // Stores available vendors to populate the vendor supplier dropdown
  // FACULTY MAY ASK: How do you allow staff to be unassigned (Internal / Checkmate direct)?
  // HOW TO CHANGE: In the vendor dropdown, add an extra option `<option value="Internal">Internal (Checkmate)</option>`.
  const [vendors, setVendors] = useState([]);

  // Loading state placeholder toggle
  const [loading, setLoading] = useState(true);

  // Network error state banner
  const [error, setError] = useState(null);

  // Search keyword filter query
  const [searchQuery, setSearchQuery] = useState('');

  // Add/Edit modal visibility and target staff ID
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form input field state for staff creation and modification
  // FACULTY MAY ASK: How do you set default availability to "Available"?
  // HOW TO CHANGE: In the initial formData state below, set `avail: 'Available'`.
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    vendor: '',
    phone: '',
    avail: 'Available',
    status: 'Active',
  });

  // Form validation errors map
  // FACULTY MAY ASK: How do you validate standard 10-digit phone number format?
  // HOW TO CHANGE: In validateForm(), add regex check `/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))`.
  const [formErrors, setFormErrors] = useState({});

  // Target staff member marked for deletion
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Floating user action feedback toast
  const [toast, setToast] = useState(null);

  // Loads staff members and vendors concurrently from backend APIs
  // FACULTY MAY ASK: Why is Promise.allSettled used here?
  // HOW TO CHANGE: Ensures the staff roster still displays even if vendor service is slow or unresponsive.
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [staffRes, vendorsRes] = await Promise.allSettled([
        fetchStaff(),
        fetchVendors(),
      ]);

      const sData = staffRes.status === 'fulfilled' && Array.isArray(staffRes.value) ? staffRes.value : [];
      const vData = vendorsRes.status === 'fulfilled' && Array.isArray(vendorsRes.value) ? vendorsRes.value : [];

      setStaff(sData);
      setVendors(vData);
    } catch (err) {
      setError(err.message || 'Failed to load staff list');
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

  // Compute total staff count
  const totalStaffCount = staff.length;

  // Compute available staff members ready for immediate assignment
  // FACULTY MAY ASK: How is "Available" staff calculated?
  // HOW TO CHANGE: Filters `staff.filter(s => s.avail === 'Available').length`.
  const availableStaffCount = useMemo(() => {
    return staff.filter((s) => s.avail === 'Available').length;
  }, [staff]);

  // Compute active staff personnel
  const activeStaffCount = useMemo(() => {
    return staff.filter((s) => s.status === 'Active').length;
  }, [staff]);

  // Filters staff by search query against name, role, vendor, or staff ID
  const filteredStaff = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return staff;
    return staff.filter(
      (s) =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.role && s.role.toLowerCase().includes(q)) ||
        (s.vendor && s.vendor.toLowerCase().includes(q)) ||
        (s.id && String(s.id).toLowerCase().includes(q))
    );
  }, [staff, searchQuery]);

  // Validates form input fields before submission
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Full name is required';
    if (!formData.role.trim()) errors.role = 'Role is required';
    if (!formData.vendor) errors.vendor = 'Please select a vendor';
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    if (!formData.avail) errors.avail = 'Please select availability';
    if (!formData.status) errors.status = 'Please select a status';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Opens modal for adding a new staff member
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      role: '',
      vendor: vendors.length > 0 ? vendors[0].name : '',
      phone: '',
      avail: 'Available',
      status: 'Active',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Opens modal pre-populated for editing an existing staff member
  const handleOpenEdit = (s) => {
    setEditingId(s.id);
    setFormData({
      name: s.name || '',
      role: s.role || '',
      vendor: s.vendor || '',
      phone: s.phone || '',
      avail: s.avail || 'Available',
      status: s.status || 'Active',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Submits the staff form (POST for create, PATCH for update)
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    const existingMember = editingId ? staff.find((s) => s.id === editingId) : null;
    const payload = {
      name: formData.name.trim(),
      role: formData.role.trim(),
      vendor: formData.vendor,
      phone: formData.phone.trim(),
      avail: formData.avail,
      status: formData.status,
      events: existingMember ? existingMember.events || 0 : 0,
    };

    try {
      if (editingId) {
        await updateStaff(editingId, payload);
        setToast({ message: 'Staff member updated successfully!', type: 'ok' });
      } else {
        await createStaff(payload);
        setToast({ message: 'Staff member registered successfully!', type: 'ok' });
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setToast({ message: err.message || 'Operation failed', type: 'err' });
    }
  };

  // Removes a staff member after confirmation
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteStaff(deleteTarget.id);
      setToast({ message: `Staff member "${deleteTarget.name}" removed.`, type: 'info' });
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      setToast({ message: err.message || 'Failed to remove staff', type: 'err' });
    }
  };

  return (
    <div className="page">
      {/* Page Header */}
      <div className="ph">
        <h1>
          <span style={{ color: '#ec4899' }}>👤</span> All Staff
        </h1>
        <p>System-wide staff member management</p>
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

      {/* Workforce Summary Stat Cards */}
      {/* FACULTY MAY ASK: How do you show percentage of staff currently available? */}
      {/* HOW TO CHANGE: Compute `((availableStaffCount / totalStaffCount) * 100).toFixed(0)` and pass as subtext to the Available StatCard. */}
      <div className="stats">
        <StatCard
          label="Total Staff"
          value={loading ? '...' : totalStaffCount.toLocaleString()}
          subtext="All staff members"
          icon="👥"
          colorClass="teal"
          borderColor="rgba(34, 211, 238, 0.25)"
        />
        <StatCard
          label="Available"
          value={loading ? '...' : availableStaffCount.toLocaleString()}
          subtext="Ready for assignment"
          icon="✓"
          colorClass="green"
          borderColor="rgba(16, 185, 129, 0.25)"
        />
        <StatCard
          label="Active"
          value={loading ? '...' : activeStaffCount.toLocaleString()}
          subtext="Active status"
          icon="●"
          colorClass="purple"
          borderColor="rgba(167, 139, 250, 0.25)"
        />
      </div>

      {/* Action Row: Search bar & Add Staff CTA */}
      <div className="top-row">
        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search staff members by name, role, or vendor..."
        />
        <button className="btn btn-p" onClick={handleOpenAdd} type="button">
          + Add Staff
        </button>
      </div>

      {/* Staff Roster Data Table */}
      {/* FACULTY MAY ASK: How do you change phone numbers to be clickable links for calling? */}
      {/* HOW TO CHANGE: In the phone <td>, render `<a href={`tel:${s.phone}`}>{s.phone}</a>`. */}
      <DataTable
        icon="👤"
        title={`All Staff Members (${filteredStaff.length})`}
        headers={[
          'Staff ID',
          'Name',
          'Role',
          'Vendor',
          'Phone',
          'Availability',
          'Assigned Events',
          'Status',
          'Actions',
        ]}
        isEmpty={filteredStaff.length === 0}
        emptyMessage="No staff found"
        emptyIcon="👤"
      >
        {filteredStaff.map((s) => (
          <tr key={s.id}>
            <td className="tid">{s.id}</td>
            <td className="tname">{s.name}</td>
            <td>{s.role}</td>
            <td>{s.vendor}</td>
            <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{s.phone}</td>
            <td>
              <StatusBadge text={s.avail} />
            </td>
            <td style={{ fontWeight: 700, color: '#f59e0b' }}>{s.events || 0}</td>
            <td>
              <StatusBadge text={s.status} />
            </td>
            <td>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button
                  className="ib ib-e"
                  onClick={() => handleOpenEdit(s)}
                  title="Edit"
                  type="button"
                >
                  ✏
                </button>
                <button
                  className="ib ib-d"
                  onClick={() => setDeleteTarget(s)}
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

      {/* Add / Edit Staff Modal */}
      {isModalOpen && (
        <div
          className="ov open"
          onClick={(ev) => {
            if (ev.target === ev.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="modal">
            <div className="mh">
              <span className="mt">{editingId ? 'Edit Staff Member' : 'Add Staff Member'}</span>
              <button className="mx" onClick={() => setIsModalOpen(false)} type="button">
                ✕
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="fg2">
                <div className="fg">
                  <label className="fl">Full Name *</label>
                  <input
                    className={`fc ${formErrors.name ? 'fc-err' : ''}`}
                    placeholder="e.g. Mike Johnson"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  {formErrors.name && <div className="ferr">{formErrors.name}</div>}
                </div>

                <div className="fg">
                  <label className="fl">Role *</label>
                  <input
                    className={`fc ${formErrors.role ? 'fc-err' : ''}`}
                    placeholder="e.g. Event Coordinator"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  />
                  {formErrors.role && <div className="ferr">{formErrors.role}</div>}
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
                  <label className="fl">Phone *</label>
                  <input
                    className={`fc ${formErrors.phone ? 'fc-err' : ''}`}
                    placeholder="e.g. 555-0101"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                  {formErrors.phone && <div className="ferr">{formErrors.phone}</div>}
                </div>

                <div className="fg">
                  <label className="fl">Availability *</label>
                  <select
                    className={`fc ${formErrors.avail ? 'fc-err' : ''}`}
                    value={formData.avail}
                    onChange={(e) => setFormData({ ...formData, avail: e.target.value })}
                  >
                    <option value="Available">Available</option>
                    <option value="Busy">Busy</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                  {formErrors.avail && <div className="ferr">{formErrors.avail}</div>}
                </div>

                <div className="fg">
                  <label className="fl">Status *</label>
                  <select
                    className={`fc ${formErrors.status ? 'fc-err' : ''}`}
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                  {formErrors.status && <div className="ferr">{formErrors.status}</div>}
                </div>
              </div>

              <div className="mf">
                <button className="btn btn-s" onClick={() => setIsModalOpen(false)} type="button">
                  Cancel
                </button>
                <button className="btn btn-p" type="submit">
                  Save Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Deletion Dialog */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Remove Staff"
        message={`Are you sure you want to remove "${deleteTarget?.name}" from the system? Active event assignments may be affected.`}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
        confirmText="Remove"
        isDestructive={true}
      />

      {/* Floating Action Feedback Toast */}
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
}

/* ============================================================
   VIVA QUICK NOTES - Staff.jsx
   ============================================================
   DATA FLOW:
   1. Backend Ingestion: fetchStaff() and fetchVendors() load all personnel records and supplier entities.
   2. State Management: raw records live in staff state; formData manages active modal editing.
   3. Real-Time Derived Metrics: availableStaffCount and activeStaffCount dynamically computed from staff state.
   4. Live Search: filteredStaff memoizes keyword searches matching across name, role, vendor, and ID.
   5. Direct CRUD Mutability: handleSave() handles POST/PATCH; handleConfirmDelete() sends DELETE /api/staff/:id.

   TOP 5 QUESTIONS FACULTY IS MOST LIKELY TO ASK:
   1. "Add an extra availability status (e.g., 'In Training')":
      -> Add `<option value="In Training">In Training</option>` inside the Availability select in the modal JSX and in StatusBadge.jsx.
   2. "How do you show how many total events are assigned across all staff members?":
      -> Calculate `staff.reduce((sum, s) => sum + (Number(s.events) || 0), 0)`.
   3. "Where does the phone number monospace font come from?":
      -> Set inline in the table cell: `style={{ fontFamily: 'monospace', fontSize: '12px' }}`.
   4. "How do you filter only staff from a specific vendor?":
      -> In filteredStaff, add `s.vendor.toLowerCase() === selectedVendor.toLowerCase()`.
   5. "How does the modal know to preserve the existing event count when editing?":
      -> handleSave() looks up the existing member and sets `events: existingMember ? existingMember.events || 0 : 0`.
   ============================================================ */
