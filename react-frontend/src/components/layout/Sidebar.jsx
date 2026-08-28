import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = () => {
  const location = useLocation();
  const { role } = useAuth();
  const currentRole = (role || 'client').toLowerCase();

  const navItems = {
    admin: [
      { path: '/admin/dashboard', label: 'Dashboard', icon: 'ph-grid-four' },
      { path: '/admin/manage-users', label: 'Manage Users', icon: 'ph-users' },
      { path: '/admin/vendor-approvals', label: 'Vendor Approvals', icon: 'ph-check-square' },
      { path: '/admin/monitor-events', label: 'Monitor Events', icon: 'ph-desktop' },
      { path: '/admin/coordination', label: 'Coordination', icon: 'ph-arrows-left-right' },
      { path: '/admin/issue-tracking', label: 'Issue Tracking', icon: 'ph-warning' },
      { path: '/admin/payouts', label: 'Payouts', icon: 'ph-currency-dollar' },
      { path: '/admin/report-analytics', label: 'Analytics', icon: 'ph-chart-bar' },
      { path: '/admin/audit-logs', label: 'Audit Logs', icon: 'ph-list-checks' },
      { path: '/admin/settings', label: 'Settings', icon: 'ph-gear' },
    ],
    client: [
      { path: '/client/dashboard', label: 'Dashboard', icon: 'ph-grid-four' },
      { path: '/client/browse-packages', label: 'Browse Packages', icon: 'ph-package' },
      { path: '/client/create-event', label: 'Create Event', icon: 'ph-plus-circle' },
      { path: '/client/my-events', label: 'My Events', icon: 'ph-calendar' },
      { path: '/client/track-progress', label: 'Track Progress', icon: 'ph-chart-line-up' },
      { path: '/client/coordination', label: 'Coordination', icon: 'ph-chat-circle-dots' },
      { path: '/client/billing', label: 'Billing', icon: 'ph-receipt' },
      { path: '/client/report-issue', label: 'Report Issue', icon: 'ph-warning-circle' },
    ],
    staff: [
      { path: '/staff/dashboard', label: 'Dashboard', icon: 'ph-grid-four' },
      { path: '/staff/assigned-events', label: 'Assigned Events', icon: 'ph-calendar-check' },
      { path: '/staff/task-board', label: 'Task Board', icon: 'ph-kanban' },
      { path: '/staff/schedule', label: 'Schedule', icon: 'ph-clock' },
      { path: '/staff/messages', label: 'Messages', icon: 'ph-chats-teardrop' },
      { path: '/staff/performance', label: 'Performance', icon: 'ph-trend-up' },
      { path: '/staff/report-issue', label: 'Report Issue', icon: 'ph-shield-warning' },
    ],
    vendor: [
      { path: '/vendor/dashboard', label: 'Dashboard', icon: 'ph-grid-four' },
      { path: '/vendor/event-requests', label: 'Event Requests', icon: 'ph-clipboard-text' },
      { path: '/vendor/preset-packages', label: 'Packages', icon: 'ph-cube' },
      { path: '/vendor/manage-resources', label: 'Resources', icon: 'ph-stack' },
      { path: '/vendor/manage-staff', label: 'Staff Management', icon: 'ph-user-list' },
      { path: '/vendor/coordination', label: 'Coordination', icon: 'ph-chats' },
      { path: '/vendor/monitoring', label: 'Live Monitoring', icon: 'ph-monitor' },
      { path: '/vendor/verify-docs', label: 'Verify Docs', icon: 'ph-file-check' },
      { path: '/vendor/report-issue', label: 'Report Issue', icon: 'ph-warning' },
    ],
    superuser: [
      { path: '/superuser/dashboard', label: 'Dashboard', icon: 'ph-grid-four' },
      { path: '/superuser/users', label: 'All Users', icon: 'ph-users-three' },
      { path: '/superuser/events', label: 'All Events', icon: 'ph-calendar' },
      { path: '/superuser/resources', label: 'All Resources', icon: 'ph-database' },
      { path: '/superuser/staff', label: 'All Staff', icon: 'ph-identification-card' },
      { path: '/superuser/bookings', label: 'Bookings', icon: 'ph-bookmark-simple' },
    ]
  };

  const currentNav = navItems[currentRole] || navItems.client;

  return (
    <aside className="sidebar" style={{ width: '260px', background: 'var(--bg-sidebar, #0f172a)', borderRight: '1px solid var(--border, rgba(255,255,255,0.08))', padding: '24px 16px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: '#fff', fontSize: '20px', fontWeight: 700, padding: '0 8px 24px 8px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="ph-fill ph-calendar-blank" style={{ fontSize: '20px', color: '#fff' }}></i>
        </div>
        <span>Checkmate</span>
      </Link>

      <div style={{ marginTop: '20px', flex: 1, overflowY: 'auto' }}>
        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted, #64748b)', padding: '0 12px 12px 12px', fontWeight: 700 }}>
          {currentRole} Menu
        </div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {currentNav.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    color: isActive ? '#fff' : 'var(--text-secondary, #94a3b8)',
                    background: isActive ? 'linear-gradient(90deg, rgba(233,30,140,0.2) 0%, rgba(139,92,246,0.1) 100%)' : 'transparent',
                    border: isActive ? '1px solid rgba(233,30,140,0.3)' : '1px solid transparent',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: isActive ? 600 : 500,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <i className={`ph ${item.icon}`} style={{ fontSize: '18px', color: isActive ? '#ec4899' : 'inherit' }}></i>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
};
