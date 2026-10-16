/**
 * PAGE: Events.jsx
 * WHAT IT DOES:
 *   Platform-wide event governance interface for the EventPro Superuser module.
 *   Provides real-time search filtering across event titles, venues, clients, and vendors,
 *   full CRUD management (registering events, modifying venues/types/dates/guests/statuses,
 *   inspecting event specifications, and removing cancelled events), and real-time backend synchronization.
 *
 * APIS USED:
 *   - GET    /api/events       -> retrieves all platform events
 *   - POST   /api/events       -> registers a new event
 *   - PATCH  /api/events/:id   -> updates event venue, date, guest count, or status
 *   - DELETE /api/events/:id   -> deletes an event from the database
 *   - GET    /api/vendors      -> populates the assigned vendor dropdown
 */

import React, { useState, useEffect, useMemo } from 'react';
import '../../styles/superuser.css';
import SearchBar from './components/SearchBar';
import DataTable from './components/DataTable';
import StatusBadge from './components/StatusBadge';
import ConfirmModal from './components/ConfirmModal';
import DetailModal from './components/DetailModal';
import Toast from './components/Toast';
import {
  fetchEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  fetchVendors,
  normalizeDate,
} from '../../services/superuserApi';

export default function SuperuserEvents() {
  // Stores raw list of all platform events loaded from the backend
  // FACULTY MAY ASK: Where are event records stored and fetched from?
  // HOW TO CHANGE: Loaded from /api/events inside loadData() and kept in this events state array.
  const [events, setEvents] = useState([]);

  // Stores available vendors for assignment in the event modal
  // FACULTY MAY ASK: How do you add a default vendor option?
  // HOW TO CHANGE: In the modal vendor dropdown, add an extra <option value="Default">Default Vendor</option>.
  const [vendors, setVendors] = useState([]);

  // Loading state placeholder toggle
  // FACULTY MAY ASK: How do you show a skeleton loader instead of text?
  // HOW TO CHANGE: Conditionally render a skeleton component when loading is true.
  const [loading, setLoading] = useState(true);

  // Network or API communication error state
  // FACULTY MAY ASK: How do you customize the error banner display?
  // HOW TO CHANGE: Edit the "{error && ...}" JSX block below.
  const [error, setError] = useState(null);

  // Search keyword query string
  // FACULTY MAY ASK: Which fields are searchable in this view?
  // HOW TO CHANGE: Search filters event name, venue, client, vendor, and event ID inside filteredEvents useMemo.
  const [searchQuery, setSearchQuery] = useState('');

  // Modal open flag and ID of the event currently being edited
  // FACULTY MAY ASK: How do you know whether the modal will add or update an event?
  // HOW TO CHANGE: If editingId is null, handleSave() invokes createEvent(); otherwise it invokes updateEvent().
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form input state for event creation and editing
  // FACULTY MAY ASK: How do you set a default event type like "Wedding"?
  // HOW TO CHANGE: Change type: '' to type: 'Wedding' in the initial state below.
  const [formData, setFormData] = useState({
    name: '',
    venue: '',
    client: '',
    vendor: '',
    date: '',
    type: 'Wedding',
    guests: '',
    status: 'Pending',
  });

  // Form validation errors map
  // FACULTY MAY ASK: How do you enforce a minimum guest requirement of 20 people?
  // HOW TO CHANGE: In validateForm(), change `Number(formData.guests) < 1` to `Number(formData.guests) < 20`.
  const [formErrors, setFormErrors] = useState({});

  // View detail modal fields state
  const [viewingFields, setViewingFields] = useState(null);

  // Target event marked for deletion
  const [deleteTarget, setDeleteTarget] = useState(null);

  // User action feedback toast message
  const [toast, setToast] = useState(null);

  // Loads events and vendors from backend APIs concurrently
  // FACULTY MAY ASK: Why is Promise.allSettled used here?
  // HOW TO CHANGE: Prevents failure in vendor list loading from breaking event table rendering.
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [eventsRes, vendorsRes] = await Promise.allSettled([
        fetchEvents(),
        fetchVendors(),
      ]);

      const eData = eventsRes.status === 'fulfilled' && Array.isArray(eventsRes.value) ? eventsRes.value : [];
      const vData = vendorsRes.status === 'fulfilled' && Array.isArray(vendorsRes.value) ? vendorsRes.value : [];

      setEvents(eData);
      setVendors(vData);
    } catch (err) {
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  // Mount effect to fetch events and auto-refresh every 10 seconds
  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 10000);
    return () => clearInterval(timer);
  }, []);

  // Filters event list based on search keyword
  // FACULTY MAY ASK: How do you filter events by status tab (e.g. Confirmed vs Pending)?
  // HOW TO CHANGE: Add an activeStatus state tab and filter with `e.status === activeStatus`.
  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return events;
    return events.filter(
      (e) =>
        (e.name && e.name.toLowerCase().includes(q)) ||
        (e.venue && e.venue.toLowerCase().includes(q)) ||
        (e.client && e.client.toLowerCase().includes(q)) ||
        (e.vendor && e.vendor.toLowerCase().includes(q)) ||
        (e.id && String(e.id).toLowerCase().includes(q))
    );
  }, [events, searchQuery]);

  // Validates mandatory event attributes before submission
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Event name is required';
    if (!formData.venue.trim()) errors.venue = 'Venue is required';
    if (!formData.client.trim()) errors.client = 'Client is required';
    if (!formData.vendor) errors.vendor = 'Please select a vendor';
    if (!formData.type) errors.type = 'Please select an event type';
    if (!formData.status) errors.status = 'Please select a status';
    if (formData.guests === '' || isNaN(Number(formData.guests)) || Number(formData.guests) < 1) {
      errors.guests = 'Valid guest count (minimum 1) required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Opens modal for registering a new event
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      venue: '',
      client: '',
      vendor: vendors.length > 0 ? vendors[0].name : '',
      date: new Date().toISOString().split('T')[0],
      type: 'Wedding',
      guests: '',
      status: 'Pending',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Opens modal pre-populated with an existing event for editing
  // FACULTY MAY ASK: How do you handle ISO date formatting in date input fields?
  // HOW TO CHANGE: Date inputs require 'YYYY-MM-DD'. If e.date has slashes, split and format as ISO.
  const handleOpenEdit = (e) => {
    setEditingId(e.id);
    let formattedDate = e.date || '';
    if (formattedDate.includes('/')) {
      const parts = formattedDate.split('/');
      if (parts.length === 3) {
        formattedDate = `${parts[2]}-${String(parts[0]).padStart(2, '0')}-${String(parts[1]).padStart(2, '0')}`;
      }
    }
    setFormData({
      name: e.name || '',
      venue: e.venue || '',
      client: e.client || '',
      vendor: e.vendor || '',
      date: formattedDate,
      type: e.type || 'Wedding',
      guests: e.guests !== undefined ? String(e.guests) : '',
      status: e.status || 'Pending',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Submits the event form (POST for new event, PATCH for edit)
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      name: formData.name.trim(),
      venue: formData.venue.trim(),
      client: formData.client.trim(),
      vendor: formData.vendor,
      date: formData.date || new Date().toLocaleDateString(),
      type: formData.type,
      guests: Number(formData.guests),
      status: formData.status,
    };

    try {
      if (editingId) {
        await updateEvent(editingId, payload);
        setToast({ message: 'Event updated successfully!', type: 'ok' });
      } else {
        await createEvent(payload);
        setToast({ message: 'Event created successfully!', type: 'ok' });
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setToast({ message: err.message || 'Operation failed', type: 'err' });
    }
  };

  // Deletes an event after confirmation
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEvent(deleteTarget.id);
      setToast({ message: `Event "${deleteTarget.name}" deleted.`, type: 'info' });
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      setToast({ message: err.message || 'Failed to delete event', type: 'err' });
    }
  };

  // Opens inspect modal with key event metadata
  const handleOpenView = (e) => {
    setViewingFields([
      ['Event ID', e.id],
      ['Name', e.name],
      ['Venue', e.venue],
      ['Client', e.client],
      ['Vendor', e.vendor],
      ['Date', normalizeDate(e.date)],
      ['Type', <StatusBadge key="ty" text={e.type} />],
      ['Guests', Number(e.guests).toLocaleString()],
      ['Status', <StatusBadge key="st" text={e.status} />],
    ]);
  };

  return (
    <div className="page">
      {/* Page Header */}
      <div className="ph">
        <h1>
          <span style={{ color: '#ec4899' }}>📅</span> All Events
        </h1>
        <p>Complete system-wide event management</p>
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

      {/* Action Row: Search bar & Add Event CTA */}
      <div className="top-row">
        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search events, clients, venues, or vendors..."
        />
        <button className="btn btn-p" onClick={handleOpenAdd} type="button">
          + Add Event
        </button>
      </div>

      {/* Events Data Table */}
      {/* FACULTY MAY ASK: How do you show the event venue subtitle under the name? */}
      {/* HOW TO CHANGE: In the 2nd <td>, render <div className="tname">{e.name}</div> and <div className="tsub">{e.venue}</div>. */}
      <DataTable
        icon="📅"
        title={`All Events (${filteredEvents.length})`}
        headers={[
          'Event ID',
          'Event Name',
          'Client',
          'Vendor',
          'Date',
          'Type',
          'Guests',
          'Status',
          'Actions',
        ]}
        isEmpty={filteredEvents.length === 0}
        emptyMessage="No events found"
        emptyIcon="📅"
      >
        {filteredEvents.map((e) => (
          <tr key={e.id}>
            <td className="tid">{e.id}</td>
            <td>
              <div className="tname">{e.name}</div>
              <div className="tsub">{e.venue}</div>
            </td>
            <td>{e.client}</td>
            <td>{e.vendor}</td>
            <td>{normalizeDate(e.date)}</td>
            <td>
              <StatusBadge text={e.type} />
            </td>
            <td>{e.guests}</td>
            <td>
              <StatusBadge text={e.status} />
            </td>
            <td>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button
                  className="ib ib-v"
                  onClick={() => handleOpenView(e)}
                  title="View"
                  type="button"
                >
                  👁
                </button>
                <button
                  className="ib ib-e"
                  onClick={() => handleOpenEdit(e)}
                  title="Edit"
                  type="button"
                >
                  ✏
                </button>
                <button
                  className="ib ib-d"
                  onClick={() => setDeleteTarget(e)}
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

      {/* Add / Edit Event Modal */}
      {isModalOpen && (
        <div
          className="ov open"
          onClick={(ev) => {
            if (ev.target === ev.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="modal">
            <div className="mh">
              <span className="mt">{editingId ? 'Edit Event' : 'Add Event'}</span>
              <button className="mx" onClick={() => setIsModalOpen(false)} type="button">
                ✕
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="fg2">
                <div className="fg">
                  <label className="fl">Event Name *</label>
                  <input
                    className={`fc ${formErrors.name ? 'fc-err' : ''}`}
                    placeholder="e.g. Johnson Wedding"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  {formErrors.name && <div className="ferr">{formErrors.name}</div>}
                </div>

                <div className="fg">
                  <label className="fl">Venue *</label>
                  <input
                    className={`fc ${formErrors.venue ? 'fc-err' : ''}`}
                    placeholder="e.g. Grand Ballroom"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  />
                  {formErrors.venue && <div className="ferr">{formErrors.venue}</div>}
                </div>

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
                  <label className="fl">Date *</label>
                  <input
                    className="fc"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                <div className="fg">
                  <label className="fl">Type *</label>
                  <select
                    className={`fc ${formErrors.type ? 'fc-err' : ''}`}
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="Wedding">Wedding</option>
                    <option value="Birthday">Birthday</option>
                    <option value="Conference">Conference</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Other">Other</option>
                  </select>
                  {formErrors.type && <div className="ferr">{formErrors.type}</div>}
                </div>

                <div className="fg">
                  <label className="fl">Guest Count *</label>
                  <input
                    className={`fc ${formErrors.guests ? 'fc-err' : ''}`}
                    type="number"
                    min="1"
                    placeholder="e.g. 200"
                    value={formData.guests}
                    onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                  />
                  {formErrors.guests && <div className="ferr">{formErrors.guests}</div>}
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
              </div>

              <div className="mf">
                <button className="btn btn-s" onClick={() => setIsModalOpen(false)} type="button">
                  Cancel
                </button>
                <button className="btn btn-p" type="submit">
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Details Inspection Modal */}
      <DetailModal
        isOpen={Boolean(viewingFields)}
        title="Event Details"
        fields={viewingFields || []}
        onClose={() => setViewingFields(null)}
      />

      {/* Confirm Deletion Dialog */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Event"
        message={`Are you sure you want to permanently delete event "${deleteTarget?.name}"?`}
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
   VIVA QUICK NOTES - Events.jsx
   ============================================================
   DATA FLOW:
   1. Backend Ingestion: fetchEvents() and fetchVendors() load events and registered vendors concurrently.
   2. Client-Side Normalization: normalizeDate() handles both slash-separated and ISO standard date formats.
   3. Real-Time Filtering: filteredEvents memoizes keyword matches across name, venue, client, vendor, and ID.
   4. Dual-State Modal: editingId dynamically switches the form between createEvent() and updateEvent().
   5. Direct CRUD Mutability: handleConfirmDelete() sends DELETE /api/events/:id, auto-updating local UI state.

   TOP 5 QUESTIONS FACULTY IS MOST LIKELY TO ASK:
   1. "Add a new Event Type like 'Gala' or 'Festival'":
      -> Add `<option value="Gala">Gala</option>` inside the Type select in the modal JSX and in StatusBadge.jsx.
   2. "How do you show only upcoming events based on today's date?":
      -> In filteredEvents, add `new Date(e.date) >= new Date()`.
   3. "Where is the event subtitle (venue name) rendered?":
      -> Look in the table row mapping: `<div className="tsub">{e.venue}</div>` directly beneath `{e.name}`.
   4. "How do you prevent creating an event with 0 guests?":
      -> Handled in validateForm(): checks `Number(formData.guests) < 1` and marks the field error.
   5. "How does the date format convert between the HTML date input and the table view?":
      -> handleOpenEdit() reformats slashes to YYYY-MM-DD for the date input, and normalizeDate() formats it for the table.
   ============================================================ */
