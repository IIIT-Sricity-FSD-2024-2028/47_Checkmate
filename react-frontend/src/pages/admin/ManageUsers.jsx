import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Table, Button, Modal, Input, LoadingSpinner } from '../../components/common/CommonComponents';
import { userService } from '../../services/api';

export const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'Client' });
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const data = await userService.getAll();
      setUsers(data || []);
    } catch (e) {
      console.error('Error loading users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeactivate = async (id) => {
    try {
      await userService.deactivate(id);
      fetchUsers();
    } catch (e) {
      alert('Error deactivating user: ' + e.message);
    }
  };

  const handleSaveEdit = async () => {
    try {
      await userService.update(editingUser.id, editForm);
      setEditingUser(null);
      fetchUsers();
    } catch (e) {
      alert('Error updating user: ' + e.message);
    }
  };

  const filtered = users.filter((u) => {
    const matchesSearch = (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
                          (u.email || '').toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <DashboardLayout title="Manage System Users" subtitle="Control user roles, permissions and statuses">
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search user name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
        >
          <option value="all" style={{ background: '#0f172a' }}>All Roles</option>
          <option value="Client" style={{ background: '#0f172a' }}>Client</option>
          <option value="Vendor" style={{ background: '#0f172a' }}>Vendor</option>
          <option value="Staff" style={{ background: '#0f172a' }}>Staff</option>
          <option value="Admin" style={{ background: '#0f172a' }}>Admin</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner message="Fetching user directory..." />
      ) : (
        <Card title={`Users Directory (${filtered.length})`}>
          <Table headers={['User ID', 'Name', 'Email', 'Role', 'Status', 'Actions']}>
            {filtered.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px 16px', fontSize: '12px', color: '#94a3b8' }}>{u.id}</td>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{u.name}</td>
                <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{u.email}</td>
                <td style={{ padding: '12px 16px' }}><span style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(233,30,140,0.15)', color: '#ec4899', fontSize: '12px' }}>{u.role}</span></td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '12px', background: u.status === 'inactive' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: u.status === 'inactive' ? '#f87171' : '#10b981' }}>
                    {u.status || 'Active'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
                  <Button variant="outline" size="small" onClick={() => { setEditingUser(u); setEditForm({ name: u.name, email: u.email, role: u.role }); }}>
                    Edit
                  </Button>
                  {u.status !== 'inactive' && (
                    <Button variant="danger" size="small" onClick={() => handleDeactivate(u.id)}>
                      Disable
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      {editingUser && (
        <Modal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          title={`Edit User: ${editingUser.name}`}
          footer={
            <>
              <Button variant="secondary" onClick={() => setEditingUser(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveEdit}>Save Changes</Button>
            </>
          }
        >
          <Input label="Full Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          <Input label="Email Address" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>System Role</label>
            <select
              value={editForm.role}
              onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
              style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
            >
              <option value="Client" style={{ background: '#0f172a' }}>Client</option>
              <option value="Vendor" style={{ background: '#0f172a' }}>Vendor</option>
              <option value="Staff" style={{ background: '#0f172a' }}>Staff</option>
              <option value="Admin" style={{ background: '#0f172a' }}>Admin</option>
            </select>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
};
