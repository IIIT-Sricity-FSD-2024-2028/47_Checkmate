/**
 * PAGE: Users.jsx
 * WHAT IT DOES:
 *   System-wide user administration and role management console for EventPro superusers.
 *   Provides instant multi-field search filtering (by name, email, or role), real-time role
 *   and status badges, and complete user lifecycle governance (creating accounts with passwords,
 *   updating names, emails, roles, and suspension statuses, and permanently deleting accounts).
 *
 * APIS USED:
 *   - GET    /api/users       -> loads all registered system users
 *   - POST   /api/users       -> creates a new user account with role and credentials
 *   - PATCH  /api/users/:id   -> updates user profile, role, or active/inactive status
 *   - DELETE /api/users/:id   -> permanently purges a user account
 */

import React, { useState, useEffect, useMemo } from 'react';
import '../../styles/superuser.css';
import SearchBar from './components/SearchBar';
import DataTable from './components/DataTable';
import StatusBadge from './components/StatusBadge';
import ConfirmModal from './components/ConfirmModal';
import Toast from './components/Toast';
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  normalizeDate,
} from '../../services/superuserApi';

export default function SuperuserUsers() {
  // Stores raw list of all system users retrieved from the database
  // FACULTY MAY ASK: Where does the user directory originate?
  // HOW TO CHANGE: Fetched from /api/users inside loadData() and kept in this users state array.
  const [users, setUsers] = useState([]);

  // Controls the loading spinner/skeleton toggle during backend communication
  const [loading, setLoading] = useState(true);

  // Network or API communication error state
  const [error, setError] = useState(null);

  // Search keyword query string
  // FACULTY MAY ASK: How do you search specifically by user ID?
  // HOW TO CHANGE: In filteredUsers useMemo, add `|| (u.id && String(u.id).toLowerCase().includes(q))`.
  const [searchQuery, setSearchQuery] = useState('');

  // Add/Edit modal visibility toggle and ID of the user being edited (null for new user)
  // FACULTY MAY ASK: Why is the password field hidden when editing an existing user?
  // HOW TO CHANGE: Editing an existing user updates profile details; passwords should only be set on create or through a separate password reset workflow.
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form input field state for user creation and modification
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Client',
    status: 'Active',
    password: '',
  });

  // Client-side form field validation errors map
  const [formErrors, setFormErrors] = useState({});

  // Target user marked for deletion
  const [deleteTarget, setDeleteTarget] = useState(null);

  // User action feedback toast message
  const [toast, setToast] = useState(null);

  // Loads users from backend API
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Mount effect to fetch users and refresh every 10 seconds
  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 10000);
    return () => clearInterval(timer);
  }, []);

  // Filters users based on search query matching name, email, or role
  // FACULTY MAY ASK: How do you filter users by role tab (e.g. only Admins or only Clients)?
  // HOW TO CHANGE: Add a roleFilter state and include `u.role.toLowerCase() === roleFilter.toLowerCase()` in this useMemo.
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.role && u.role.toLowerCase().includes(q))
    );
  }, [users, searchQuery]);

  // Validates form input fields before sending requests
  // FACULTY MAY ASK: How is email format validated?
  // HOW TO CHANGE: In validateForm(), standard regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` checks email format.
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Full name is required';

    const emailTrimmed = formData.email.trim();
    if (!emailTrimmed) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      errors.email = 'Please enter a valid email address';
    } else {
      // Check for duplicate email across other users
      const duplicate = users.find(
        (u) => u.email.toLowerCase() === emailTrimmed.toLowerCase() && u.id !== editingId
      );
      if (duplicate) {
        errors.email = 'This email is already in use by another account';
      }
    }

    if (!formData.role) errors.role = 'Please select a role';
    if (!formData.status) errors.status = 'Please select a status';

    // Password is only mandatory when creating a new user
    if (!editingId) {
      if (!formData.password) {
        errors.password = 'Password is required for new accounts';
      } else if (formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters long';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Opens modal for creating a new user
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      email: '',
      role: 'Client',
      status: 'Active',
      password: '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Opens modal pre-populated for editing an existing user
  const handleOpenEdit = (u) => {
    setEditingId(u.id);
    setFormData({
      name: u.name || '',
      email: u.email || '',
      role: u.role || 'Client',
      status: u.status || 'Active',
      password: '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Submits the user form (POST for create, PATCH for update)
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      role: formData.role,
      status: formData.status,
      created: new Date().toLocaleDateString(),
    };

    if (!editingId && formData.password) {
      payload.password = formData.password;
    }

    try {
      if (editingId) {
        await updateUser(editingId, payload);
        setToast({ message: 'User updated successfully!', type: 'ok' });
      } else {
        await createUser(payload);
        setToast({ message: 'User account created successfully!', type: 'ok' });
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setToast({ message: err.message || 'Operation failed', type: 'err' });
    }
  };

  // Permanently deletes a user account after confirmation
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteUser(deleteTarget.id);
      setToast({ message: `User "${deleteTarget.name}" deleted.`, type: 'info' });
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      setToast({ message: err.message || 'Failed to delete user', type: 'err' });
    }
  };

  return (
    <div className="page">
      {/* Top Header with Action CTA */}
      <div className="page-top">
        <div className="ph" style={{ marginBottom: 0 }}>
          <h1>
            <span style={{ color: '#ec4899' }}>👥</span> Users Management
          </h1>
          <p>Manage all system users, permissions, and roles</p>
        </div>
        <button className="btn btn-p" onClick={handleOpenAdd} type="button">
          + Create User
        </button>
      </div>

      {/* Network Error Alert */}
      {error && (
        <div className="su-alert su-alert-error" style={{ marginTop: '16px' }}>
          <span>⚠️ {error}</span>
          <button className="btn btn-s" onClick={loadData} style={{ padding: '4px 10px' }}>
            Retry
          </button>
        </div>
      )}

      {/* Search Input Bar */}
      <div style={{ marginTop: '16px' }}>
        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, email, or role..."
        />
      </div>

      {/* Users Data Table */}
      {/* FACULTY MAY ASK: How do you show total user count in the table header? */}
      {/* HOW TO CHANGE: Passed as title prop to <DataTable>: `All Users (${filteredUsers.length})`. */}
      <DataTable
        icon="🛡"
        title={`All Users (${filteredUsers.length})`}
        headers={['Name', 'Email', 'Role', 'Status', 'Created Date', 'Actions']}
        isEmpty={filteredUsers.length === 0}
        emptyMessage="No users found"
        emptyIcon="👥"
      >
        {filteredUsers.map((u) => (
          <tr key={u.id}>
            <td className="tname">{u.name}</td>
            <td>{u.email}</td>
            <td>
              <StatusBadge text={u.role} />
            </td>
            <td>
              <StatusBadge text={u.status} />
            </td>
            <td>{normalizeDate(u.created || u.createdAt)}</td>
            <td>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button
                  className="ib ib-e"
                  onClick={() => handleOpenEdit(u)}
                  title="Edit"
                  type="button"
                >
                  ✏
                </button>
                <button
                  className="ib ib-d"
                  onClick={() => setDeleteTarget(u)}
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

      {/* Create / Edit User Modal */}
      {isModalOpen && (
        <div
          className="ov open"
          onClick={(ev) => {
            if (ev.target === ev.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="modal">
            <div className="mh">
              <span className="mt">{editingId ? 'Edit User' : 'Create User'}</span>
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
                    placeholder="e.g. John Smith"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  {formErrors.name && <div className="ferr">{formErrors.name}</div>}
                </div>

                <div className="fg">
                  <label className="fl">Email Address *</label>
                  <input
                    className={`fc ${formErrors.email ? 'fc-err' : ''}`}
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                  {formErrors.email && <div className="ferr">{formErrors.email}</div>}
                </div>

                <div className="fg">
                  <label className="fl">Role *</label>
                  <select
                    className={`fc ${formErrors.role ? 'fc-err' : ''}`}
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="Admin">Admin</option>
                    <option value="Vendor">Vendor</option>
                    <option value="Staff">Staff</option>
                    <option value="Client">Client</option>
                  </select>
                  {formErrors.role && <div className="ferr">{formErrors.role}</div>}
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

              {/* Password field only shown when registering a new user account */}
              {!editingId && (
                <div className="fg">
                  <label className="fl">Password *</label>
                  <input
                    className={`fc ${formErrors.password ? 'fc-err' : ''}`}
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  {formErrors.password && <div className="ferr">{formErrors.password}</div>}
                </div>
              )}

              <div className="mf">
                <button className="btn btn-s" onClick={() => setIsModalOpen(false)} type="button">
                  Cancel
                </button>
                <button className="btn btn-p" type="submit">
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Deletion Dialog */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete User"
        message={`Are you sure you want to permanently delete user account "${deleteTarget?.name}" (${deleteTarget?.email})? This action cannot be reversed.`}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
        confirmText="Delete Account"
        isDestructive={true}
      />

      {/* Floating Action Feedback Toast */}
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
}

/* ============================================================
   VIVA QUICK NOTES - Users.jsx
   ============================================================
   DATA FLOW:
   1. Backend Ingestion: fetchUsers() loads all system users from GET /api/users.
   2. State Management: raw array stored in users state; formData tracks modal form state.
   3. Search Filtering: filteredUsers memoizes case-insensitive keyword searches on name, email, and role.
   4. Validation Logic: validateForm() checks mandatory fields, email regex, duplicate emails, and 6+ char password.
   5. CRUD Execution: handleSave() calls createUser() or updateUser(); handleConfirmDelete() calls deleteUser().

   TOP 5 QUESTIONS FACULTY IS MOST LIKELY TO ASK:
   1. "Add an extra role option (e.g. 'Moderator' or 'Auditor')":
      -> In the Role select in the modal JSX, add `<option value="Auditor">Auditor</option>` and map it in StatusBadge.jsx.
   2. "How do you enforce duplicate email detection before sending the request?":
      -> In validateForm(), checks `users.find(u => u.email.toLowerCase() === email && u.id !== editingId)`.
   3. "Why is the password input only displayed when creating a user?":
      -> Look in JSX: `{!editingId && <div className="fg"><label>Password *</label>...</div>}`.
   4. "How do you suspend a user without deleting their account?":
      -> Click Edit, change Status from "Active" to "Inactive", and click Save (sends PATCH with status: 'Inactive').
   5. "How does the search bar filter across multiple properties?":
      -> filteredUsers checks `(u.name.includes(q) || u.email.includes(q) || u.role.includes(q))`.
   ============================================================ */
