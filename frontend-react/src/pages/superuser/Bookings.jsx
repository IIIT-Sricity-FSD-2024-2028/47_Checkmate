/**
 * PAGE: Bookings.jsx
 * WHAT IT DOES:
 *   Comprehensive booking management portal for EventPro superusers.
 *   Provides platform-wide revenue stat cards (total revenue & confirmed revenue),
 *   instant keyword search filtering, full CRUD capabilities (create new bookings,
 *   edit active bookings, view detailed breakdown modal, and delete cancellations),
 *   and real-time synchronization with the NestJS backend.
 *
 * APIS USED:
 *   - GET    /api/bookings       -> retrieves all system booking records
 *   - POST   /api/bookings       -> creates a brand new booking entry
 *   - PATCH  /api/bookings/:id   -> updates existing booking details (status, cost, vendor)
 *   - DELETE /api/bookings/:id   -> permanently removes a booking record
 *   - GET    /api/vendors        -> populates the vendor selection dropdown in the modal
 */

import React, { useState, useEffect, useMemo } from 'react';
import '../../styles/superuser.css';
import StatCard from './components/StatCard';
import SearchBar from './components/SearchBar';
import DataTable from './components/DataTable';
import StatusBadge from './components/StatusBadge';
import ConfirmModal from './components/ConfirmModal';
import DetailModal from './components/DetailModal';
import Toast from './components/Toast';
import {
  fetchBookings,
  createBooking,
  updateBooking,
  deleteBooking,
  fetchVendors,
  formatCurrency,
} from '../../services/superuserApi';

export default function SuperuserBookings() {
  // Stores raw list of all bookings loaded from the database
  // FACULTY MAY ASK: Where are the bookings fetched from and stored?
  // HOW TO CHANGE: Fetched from /api/bookings inside loadData() and saved into this bookings state array.
  const [bookings, setBookings] = useState([]);

  // Stores list of registered vendors used to populate the modal select dropdown
  // FACULTY MAY ASK: How do you add a static fallback vendor if the vendor API fails?
  // HOW TO CHANGE: In loadData(), provide a fallback array like [{ id: '1', name: 'Elite Catering' }].
  const [vendors, setVendors] = useState([]);

  // Controls the loading spinner/skeleton state during backend network requests
  // FACULTY MAY ASK: How do you show a customized loading indicator on this page?
  // HOW TO CHANGE: Check the "{loading && ...}" JSX block below.
  const [loading, setLoading] = useState(true);

  // Network or server error message banner
  // FACULTY MAY ASK: How do you change the error banner styling?
  // HOW TO CHANGE: In superuser.css, edit the ".su-alert-error" class rules.
  const [error, setError] = useState(null);

  // Search keyword filter query
  // FACULTY MAY ASK: How do you make search case-sensitive or insensitive?
  // HOW TO CHANGE: In filteredBookings useMemo, .toLowerCase() handles case-insensitivity. Remove it for case-sensitive.
  const [searchQuery, setSearchQuery] = useState('');

  // Add/Edit modal visibility toggle and ID of booking currently being edited (null if adding new)
  // FACULTY MAY ASK: How do you tell if the modal is in "Create" or "Edit" mode?
  // HOW TO CHANGE: If editingId is null, it's in Create mode; if editingId holds an ID string, it's in Edit mode.
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form input fields state for the Add/Edit booking modal
  // FACULTY MAY ASK: How do you add a new input field like "Deposit Paid" to the booking form?
  // HOW TO CHANGE: Add "deposit: ''" to formData state, add an input inside the modal JSX, and include it in handleSave.
  const [formData, setFormData] = useState({
    eventName: '',
    client: '',
    vendor: '',
    status: 'Pending',
    cost: '',
  });

  // Client-side form field validation error messages
  // FACULTY MAY ASK: How do you change field validation rules or error text?
  // HOW TO CHANGE: Edit the validateForm() helper function below.
  const [formErrors, setFormErrors] = useState({});

  // View modal state for inspecting full booking metadata
  // FACULTY MAY ASK: How do you add more fields to the booking view modal?
  // HOW TO CHANGE: In viewBooking(), add extra key-value pairs to the viewingFields array passed into DetailModal.
  const [viewingFields, setViewingFields] = useState(null);

  // Delete confirmation modal state
  // FACULTY MAY ASK: How do you bypass the delete confirmation modal?
  // HOW TO CHANGE: Call executeDelete(id) directly from the table delete button instead of setting deleteTarget.
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Floating toast notification feedback message and type ('ok', 'info', 'err')
  // FACULTY MAY ASK: How do you trigger an error toast when an API fails?
  // HOW TO CHANGE: Call setToast({ message: '...', type: 'err' }).
  const [toast, setToast] = useState(null);

  // Asynchronously loads bookings and vendors from the backend
  // FACULTY MAY ASK: Why are both bookings and vendors fetched together on mount?
  // HOW TO CHANGE: Promise.allSettled runs both in parallel, ensuring the table has rows and the modal has vendor options immediately.
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [bookingsRes, vendorsRes] = await Promise.allSettled([
        fetchBookings(),
        fetchVendors(),
      ]);

      const bData = bookingsRes.status === 'fulfilled' && Array.isArray(bookingsRes.value) ? bookingsRes.value : [];
      const vData = vendorsRes.status === 'fulfilled' && Array.isArray(vendorsRes.value) ? vendorsRes.value : [];

      setBookings(bData);
      setVendors(vData);
    } catch (err) {
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  // Mount effect to fetch data and refresh every 10 seconds
  // FACULTY MAY ASK: Why does this useEffect have a cleanup function?
  // HOW TO CHANGE: clearInterval(timer) prevents memory leaks when navigating away from Bookings.
  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 10000);
    return () => clearInterval(timer);
  }, []);

  // Compute total system revenue across all bookings
  const totalRevenue = useMemo(() => {
    return bookings.reduce((sum, b) => sum + (Number(b.cost) || 0), 0);
  }, [bookings]);

  // Compute confirmed revenue (Confirmed + Completed bookings only)
  // FACULTY MAY ASK: Which booking statuses count toward "Confirmed Revenue"?
  // HOW TO CHANGE: Currently checks ['Confirmed', 'Completed']. To include 'In Progress', add it to the array below.
  const confirmedRevenue = useMemo(() => {
    return bookings
      .filter((b) => ['Confirmed', 'Completed'].includes(b.status))
      .reduce((sum, b) => sum + (Number(b.cost) || 0), 0);
  }, [bookings]);

  // Filters booking records based on search input against event name, client, vendor, or booking ID
  // FACULTY MAY ASK: How do you add date filtering to this search?
  // HOW TO CHANGE: Add `|| (b.created && b.created.includes(q))` to the filter condition below.
  const filteredBookings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter(
      (b) =>
        (b.eventName && b.eventName.toLowerCase().includes(q)) ||
        (b.client && b.client.toLowerCase().includes(q)) ||
        (b.vendor && b.vendor.toLowerCase().includes(q)) ||
        (b.id && String(b.id).toLowerCase().includes(q))
    );
  }, [bookings, searchQuery]);

  // Validates form input fields before submission
  // FACULTY MAY ASK: How do you enforce a minimum booking cost of $1,000?
  // HOW TO CHANGE: In validateForm(), change `Number(formData.cost) < 0` to `Number(formData.cost) < 1000`.
  const validateForm = () => {
    const errors = {};
    if (!formData.eventName.trim()) errors.eventName = 'Event name is required';
    if (!formData.client.trim()) errors.client = 'Client name is required';
    if (!formData.vendor) errors.vendor = 'Please select a vendor';
    if (!formData.status) errors.status = 'Please select a status';
    if (formData.cost === '' || isNaN(Number(formData.cost)) || Number(formData.cost) < 0) {
      errors.cost = 'Valid non-negative cost required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Opens the modal for adding a new booking
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      eventName: '',
      client: '',
      vendor: vendors.length > 0 ? vendors[0].name : '',
      status: 'Pending',
      cost: '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Opens the modal pre-filled with an existing booking's data for editing
  // FACULTY MAY ASK: How does the form know which booking to edit?
  // HOW TO CHANGE: It looks up the booking by ID in `bookings.find(b => b.id === id)` and populates formData.
  const handleOpenEdit = (b) => {
    setEditingId(b.id);
    setFormData({
      eventName: b.eventName || '',
      client: b.client || '',
      vendor: b.vendor || '',
      status: b.status || 'Pending',
      cost: b.cost !== undefined ? String(b.cost) : '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Submits the booking form to the backend (POST for create, PATCH for update)
  // FACULTY MAY ASK: What happens when the user clicks "Save Booking"?
  // HOW TO CHANGE: validateForm() runs first; if valid, sends payload to updateBooking() or createBooking() and refreshes state.
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      eventName: formData.eventName.trim(),
      client: formData.client.trim(),
      vendor: formData.vendor,
      status: formData.status,
      cost: Number(formData.cost),
      created: new Date().toLocaleDateString(),
    };

    try {
      if (editingId) {
        await updateBooking(editingId, payload);
        setToast({ message: 'Booking updated successfully!', type: 'ok' });
      } else {
        await createBooking(payload);
        setToast({ message: 'Booking created successfully!', type: 'ok' });
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setToast({ message: err.message || 'Operation failed', type: 'err' });
    }
  };

  // Executes booking deletion after user confirms in the dialog
  // FACULTY MAY ASK: How does booking deletion work under the hood?
  // HOW TO CHANGE: Calls DELETE /api/bookings/:id via deleteBooking(), triggers toast, and re-fetches records.
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteBooking(deleteTarget.id);
      setToast({ message: `Booking for "${deleteTarget.eventName}" deleted.`, type: 'info' });
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      setToast({ message: err.message || 'Failed to delete booking', type: 'err' });
    }
  };

  // Opens the view modal with key metadata formatted in a 2-column grid
  const handleOpenView = (b) => {
    setViewingFields([
      ['Booking ID', b.id],
      ['Event Name', b.eventName],
      ['Client', b.client],
      ['Vendor', b.vendor],
      ['Status', <StatusBadge key="sb" text={b.status} />],
      ['Total Cost', <span key="tc" style={{ fontWeight: 700, color: '#10b981' }}>{formatCurrency(b.cost)}</span>],
      ['Created', b.created || new Date().toLocaleDateString()],
    ]);
  };

  return (
    <div className="page">
      {/* Page Header */}
      <div className="ph">
        <h1>
          <span style={{ color: '#ec4899' }}>📖</span> All Bookings
        </h1>
        <p>Complete system-wide booking management</p>
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

      {/* Revenue Stat Summary Cards */}
      {/* FACULTY MAY ASK: How do you display the percentage difference between confirmed and total revenue? */}
      {/* HOW TO CHANGE: Compute `((confirmedRevenue / totalRevenue) * 100).toFixed(1)` and pass as subtext to the Confirmed Revenue StatCard. */}
      <div className="stats2">
        <StatCard
          label="Total Revenue"
          value={loading ? '...' : formatCurrency(totalRevenue)}
          subtext="All bookings"
          icon="$"
          colorClass="green"
          borderColor="rgba(16, 185, 129, 0.3)"
        />
        <StatCard
          label="Confirmed Revenue"
          value={loading ? '...' : formatCurrency(confirmedRevenue)}
          subtext="Confirmed + Completed"
          icon="$"
          colorClass="teal"
          borderColor="rgba(34, 211, 238, 0.28)"
        />
      </div>

      {/* Top action row: Search bar & Add Booking CTA */}
      <div className="top-row">
        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search bookings by event, client, vendor, or ID..."
        />
        <button className="btn btn-p" onClick={handleOpenAdd} type="button">
          + Add Booking
        </button>
      </div>

      {/* Bookings Data Table */}
      {/* FACULTY MAY ASK: How do you add sorting by Total Cost to this table? */}
      {/* HOW TO CHANGE: In filteredBookings, call .sort((a, b) => b.cost - a.cost). */}
      <DataTable
        icon="📖"
        title={`All Bookings (${filteredBookings.length})`}
        headers={[
          'Booking ID',
          'Event Name',
          'Client',
          'Vendor',
          'Status',
          'Total Cost',
          'Created',
          'Actions',
        ]}
        isEmpty={filteredBookings.length === 0}
        emptyMessage="No bookings found"
        emptyIcon="📖"
      >
        {filteredBookings.map((b) => (
          <tr key={b.id}>
            <td className="tid">{b.id}</td>
            <td className="tname">{b.eventName}</td>
            <td>{b.client}</td>
            <td>{b.vendor}</td>
            <td>
              <StatusBadge text={b.status} />
            </td>
            <td style={{ fontWeight: 700, color: '#10b981' }}>
              {formatCurrency(b.cost)}
            </td>
            <td>{b.created || 'N/A'}</td>
            <td>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button
                  className="ib ib-v"
                  onClick={() => handleOpenView(b)}
                  title="View"
                  type="button"
                >
                  👁
                </button>
                <button
                  className="ib ib-e"
                  onClick={() => handleOpenEdit(b)}
                  title="Edit"
                  type="button"
                >
                  ✏
                </button>
                <button
                  className="ib ib-d"
                  onClick={() => setDeleteTarget(b)}
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

      {/* Add / Edit Booking Modal */}
      {isModalOpen && (
        <div
          className="ov open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="modal">
            <div className="mh">
              <span className="mt">{editingId ? 'Edit Booking' : 'Add Booking'}</span>
              <button className="mx" onClick={() => setIsModalOpen(false)} type="button">
                ✕
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="fg">
                <label className="fl">Event Name *</label>
                <input
                  className={`fc ${formErrors.eventName ? 'fc-err' : ''}`}
                  placeholder="e.g. Johnson Wedding"
                  value={formData.eventName}
                  onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                />
                {formErrors.eventName && <div className="ferr">{formErrors.eventName}</div>}
              </div>

              <div className="fg2">
                <div className="fg">
                  <label className="fl">Client *</label>
                  <input
                    className={`fc ${formErrors.client ? 'fc-err' : ''}`}
                    placeholder="Client name"
                    value={formData.client}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                  />
                  {formErrors.client && <div className="ferr">{formErrors.client}</div>}
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
                  <label className="fl">Status *</label>
                  <select
                    className={`fc ${formErrors.status ? 'fc-err' : ''}`}
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Confirmed">Confirmed</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                  {formErrors.status && <div className="ferr">{formErrors.status}</div>}
                </div>

                <div className="fg">
                  <label className="fl">Total Cost ($) *</label>
                  <input
                    className={`fc ${formErrors.cost ? 'fc-err' : ''}`}
                    type="number"
                    min="0"
                    placeholder="e.g. 25000"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  />
                  {formErrors.cost && <div className="ferr">{formErrors.cost}</div>}
                </div>
              </div>

              <div className="mf">
                <button className="btn btn-s" onClick={() => setIsModalOpen(false)} type="button">
                  Cancel
                </button>
                <button className="btn btn-p" type="submit">
                  Save Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Booking Details Modal */}
      <DetailModal
        isOpen={Boolean(viewingFields)}
        title="Booking Details"
        fields={viewingFields || []}
        onClose={() => setViewingFields(null)}
      />

      {/* Confirm Deletion Dialog */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Booking"
        message={`Are you sure you want to delete the booking for "${deleteTarget?.eventName}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
        confirmText="Delete"
        isDestructive={true}
      />

      {/* User Action Feedback Toast */}
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
}

/* ============================================================
   VIVA QUICK NOTES - Bookings.jsx
   ============================================================
   DATA FLOW:
   1. Backend Ingestion: fetchBookings() and fetchVendors() load booking records and available vendors.
   2. State Management: raw records live in bookings state; formData manages active modal editing.
   3. Real-Time Derived Metrics: totalRevenue and confirmedRevenue calculated via useMemo from booking costs.
   4. Live Search: filteredBookings dynamically filters records against event name, client, vendor, and ID.
   5. CRUD Mutability: handleSave() handles POST/PATCH calls; handleConfirmDelete() sends DELETE /api/bookings/:id.

   TOP 5 QUESTIONS FACULTY IS MOST LIKELY TO ASK:
   1. "Change Confirmed Revenue to include 'In Progress' bookings":
      -> Look in confirmedRevenue useMemo around line 130: change `['Confirmed', 'Completed']` to `['Confirmed', 'Completed', 'In Progress']`.
   2. "Add a minimum booking fee check of $500":
      -> In validateForm(), change `Number(formData.cost) < 0` to `Number(formData.cost) < 500`.
   3. "How does the search bar filter across multiple properties?":
      -> filteredBookings useMemo checks eventName, client, vendor, and id with .includes(query).
   4. "How do you add an extra column (e.g. Deposit) to the table?":
      -> Add 'Deposit' to the headers array in <DataTable> and add `<td>{b.deposit || '$0'}</td>` in the row map.
   5. "Where does the status badge get its custom colors?":
      -> Handled by StatusBadge.jsx which maps status strings to css classes like `.b-confirmed`, `.b-pending`.
   ============================================================ */
