import React from 'react';
import { Users } from 'lucide-react';

export default function CoordinationParticipants({ participants = [] }) {
  return (
    <div className="ch-participants">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <Users size={16} className="text-pink" />
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Active Channel Roster ({participants.length})
        </h4>
      </div>

      <div className="ch-participant-list">
        {participants.map((p) => {
          const isSelf = p.isSelf;
          const initials = p.initials || (p.name ? p.name.slice(0, 2).toUpperCase() : 'US');

          return (
            <div
              key={p.id || p.email || p.name}
              className={`ch-participant ${isSelf ? 'active-user' : ''}`}
            >
              <div className={`ch-avatar ch-avatar--${p.avatar || 'sw'}`}>
                {initials}
                <span className="ch-online-dot" />
              </div>

              <div className="ch-participant-info">
                <div className="ch-participant-name">{p.name} {isSelf ? '(You)' : ''}</div>
                <div className="ch-participant-role">
                  <span className="role-badge-coord">{p.role || 'Member'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

