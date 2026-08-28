import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { NotificationModal } from './NotificationModal';

export const Topbar = ({ title, subtitle }) => {
  const { user, role, logout } = useAuth();
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  return (
    <>
      <header className="topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 28px', borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0, color: '#fff' }}>{title || 'Dashboard'}</h1>
          {subtitle && <p style={{ fontSize: '13px', color: 'var(--text-muted, #94a3b8)', margin: '4px 0 0 0' }}>{subtitle}</p>}
        </div>

        <div className="topbar__right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            className="notif-btn"
            onClick={() => setIsNotifOpen(true)}
            style={{
              position: 'relative',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border, rgba(255,255,255,0.1))',
              borderRadius: '10px',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '18px',
              cursor: 'pointer'
            }}
          >
            <i className="ph ph-bell"></i>
            <span
              className="notif-badge"
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#ec4899',
                color: '#fff',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                fontSize: '11px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              3
            </span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '12px', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{user?.name || 'User'}</div>
              <div style={{ fontSize: '11px', color: '#ec4899', textTransform: 'capitalize' }}>{role}</div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <NotificationModal isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </>
  );
};
