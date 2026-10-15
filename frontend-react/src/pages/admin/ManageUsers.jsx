/**
 * ADMIN · MANAGE USERS (pages/admin/ManageUsers.jsx)
 * Replaces legacy: front-end/pages/admin/manage-users.html + SECTION 2 of
 * scripts/admin_js/admin.js.
 *
 * - User directory filterable by role and status, searchable by name / email / id, 10 per page.
 * - Stat cards: active clients / vendors / staff, pending users, inactive users.
 * - Edit (name, email, role) and Disable / Enable via PATCH /users/:id.
 *
 * Differences from legacy:
 * - Inactive users can be re-enabled (legacy could only disable).
 * - You cannot disable your own account, and Superuser accounts are read-only here.
 * - "Active Staff" counts Staff only; legacy also counted Admins.
 */

import { useEffect, useMemo, useState } from "react";
import { Clock, Edit3, Power, ShieldCheck, Store, User, UserX } from "lucide-react";

import "../../styles/dashboard.css";
import "../../styles/admin.css";

import AdminTopBar from "../../components/admin/AdminTopBar";
import StatisticCard from "../../components/StatisticCard";
import Modal from "../../components/Modal";
import DataTable from "../../components/table/DataTable";
import TableToolbar from "../../components/table/TableToolbar";
import Pagination from "../../components/table/Pagination";
import StatusBadge from "../../components/vendor/StatusBadge";

import { usePagination } from "../../hooks/usePagination";
import { getAuthUser } from "../../services/auth/authStorage";
import { getUsers, patchUser } from "../../services";

const ROLE_FILTER_OPTIONS = [
  { value: "all", label: "All Roles" },
  { value: "client", label: "Client" },
  { value: "vendor", label: "Vendor" },
  { value: "staff", label: "Staff" },
  { value: "admin", label: "Admin" },
  { value: "superuser", label: "Superuser" },
];

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "inactive", label: "Inactive" },
];

// Roles an admin may assign. Superuser is deliberately excluded.
const EDITABLE_ROLES = ["Client", "Vendor", "Staff", "Admin"];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const lower = (v) => String(v || "").toLowerCase();

function EditUserModal({ user, onClose, onSave, saving, error }) {
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    role: user?.role || "Client",
  });
  const [validation, setValidation] = useState("");

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setValidation("Name is required.");
    if (!EMAIL_PATTERN.test(form.email.trim())) return setValidation("Enter a valid email address.");
    setValidation("");
    onSave({ name: form.name.trim(), email: form.email.trim(), role: form.role });
  };

  return (
    <Modal
      open={Boolean(user)}
      title="Edit User Details"
      onClose={onClose}
      width={500}
      footer={
        <>
          <button type="button" className="ui-btn ui-btn--ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" form="edit-user-form" className="ui-btn ui-btn--primary" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </>
      }
    >
      <form id="edit-user-form" onSubmit={submit}>
        <div className="modal-field">
          <label htmlFor="edit-user-name">Full Name</label>
          <input id="edit-user-name" type="text" value={form.name} onChange={update("name")} />
        </div>
        <div className="modal-field">
          <label htmlFor="edit-user-email">Email Address</label>
          <input id="edit-user-email" type="email" value={form.email} onChange={update("email")} />
        </div>
        <div className="modal-field" style={{ marginBottom: 0 }}>
          <label htmlFor="edit-user-role">System Role</label>
          <select id="edit-user-role" value={form.role} onChange={update("role")}>
            {EDITABLE_ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
        {(validation || error) && (
          <div className="admin-error" style={{ marginTop: 16 }}>
            {validation || error}
          </div>
        )}
      </form>
    </Modal>
  );
}

function ManageUsers() {
  const currentUserId = getAuthUser()?.id;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [busyId, setBusyId] = useState(null); // row with an in-flight enable/disable

  useEffect(() => {
    let cancelled = false;
    getUsers()
      .then((data) => {
        if (!cancelled) setUsers(data || []);
      })
      .catch((err) => {
        console.error("Failed to load users:", err);
        if (!cancelled) setError("Could not load users.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const counts = { clients: 0, vendors: 0, staff: 0, pending: 0, inactive: 0 };
    users.forEach((u) => {
      const status = lower(u.status);
      const role = lower(u.role);
      if (status === "inactive") counts.inactive++;
      else if (status === "pending") counts.pending++;
      else if (status === "active") {
        if (role === "client") counts.clients++;
        else if (role === "vendor") counts.vendors++;
        else if (role === "staff") counts.staff++;
      }
    });
    return counts;
  }, [users]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter(
      (u) =>
        (roleFilter === "all" || lower(u.role) === roleFilter) &&
        (statusFilter === "all" || lower(u.status) === statusFilter) &&
        (!q || [u.name, u.email, u.id].some((v) => lower(v).includes(q)))
    );
  }, [users, roleFilter, statusFilter, query]);

  const { pageItems, setPage, ...pagination } = usePagination(filtered, 10);

  const replaceUser = (id, patch) =>
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));

  const setStatus = async (user, status) => {
    setBusyId(user.id);
    setError("");
    try {
      const updated = await patchUser(user.id, { status });
      replaceUser(user.id, updated || { status });
    } catch (err) {
      console.error("Status update failed:", err);
      setError(`Could not update ${user.name}: ${err?.message || "request failed"}.`);
    } finally {
      setBusyId(null);
    }
  };

  const saveEdit = async (patch) => {
    setSaving(true);
    setEditError("");
    try {
      const updated = await patchUser(editingId, patch);
      replaceUser(editingId, updated || patch);
      setEditingId(null);
    } catch (err) {
      console.error("User update failed:", err);
      setEditError(err?.message || "Could not save changes.");
    } finally {
      setSaving(false);
    }
  };

  const onFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const columns = [
    { key: "id", header: "ID" },
    { key: "name", header: "Name", className: "cell-highlight" },
    { key: "email", header: "Email" },
    { key: "role", header: "Role" },
    { key: "status", header: "Status", render: (u) => <StatusBadge status={lower(u.status)} /> },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (u) => {
        const locked = lower(u.role) === "superuser";
        const isSelf = u.id === currentUserId;
        const inactive = lower(u.status) === "inactive";
        return (
          <div className="cell-actions">
            <button
              type="button"
              className="ui-btn ui-btn--blue"
              disabled={locked}
              title={locked ? "Superuser accounts can't be edited here" : undefined}
              onClick={() => {
                setEditError("");
                setEditingId(u.id);
              }}
            >
              <Edit3 size={14} /> Edit
            </button>
            {inactive ? (
              <button
                type="button"
                className="ui-btn ui-btn--success"
                disabled={locked || busyId === u.id}
                onClick={() => setStatus(u, "Active")}
              >
                <Power size={14} /> Enable
              </button>
            ) : (
              <button
                type="button"
                className="ui-btn ui-btn--danger"
                disabled={locked || isSelf || busyId === u.id}
                title={isSelf ? "You can't disable your own account" : undefined}
                onClick={() => setStatus(u, "Inactive")}
              >
                <Power size={14} /> Disable
              </button>
            )}
          </div>
        );
      },
    },
  ];

  const editingUser = users.find((u) => u.id === editingId) || null;
  const statValue = (n) => (loading ? "-" : n);

  return (
    <div className="admin-manage-users">
      <AdminTopBar title="Manage Users" />

      <div className="content">
        {error && <div className="admin-error">{error}</div>}

        <div className="stats-grid">
          <StatisticCard title="Active Clients" value={statValue(stats.clients)} icon={User} color="blue" />
          <StatisticCard title="Active Vendors" value={statValue(stats.vendors)} icon={Store} color="purple" />
          <StatisticCard title="Active Staff" value={statValue(stats.staff)} icon={ShieldCheck} color="green" />
          <StatisticCard title="Pending Users" value={statValue(stats.pending)} icon={Clock} color="orange" />
          <StatisticCard title="Inactive Users" value={statValue(stats.inactive)} icon={UserX} color="red" />
        </div>

        <div className="card admin-table-card">
          <TableToolbar
            title="User Directory"
            filters={[
              { label: "Role", value: roleFilter, options: ROLE_FILTER_OPTIONS, onChange: onFilter(setRoleFilter) },
              {
                label: "Status",
                value: statusFilter,
                options: STATUS_FILTER_OPTIONS,
                onChange: onFilter(setStatusFilter),
              },
            ]}
            search={{
              value: query,
              placeholder: "Search users by name, email...",
              onChange: onFilter(setQuery),
            }}
          />
          <DataTable
            columns={columns}
            rows={pageItems}
            loading={loading}
            emptyMessage="No users match your filters."
          />
          <Pagination {...pagination} onPageChange={setPage} />
        </div>
      </div>

      <EditUserModal
        key={editingId || "none"}
        user={editingUser}
        onClose={() => setEditingId(null)}
        onSave={saveEdit}
        saving={saving}
        error={editError}
      />
    </div>
  );
}

export default ManageUsers;
