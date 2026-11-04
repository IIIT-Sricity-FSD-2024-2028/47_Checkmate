import React from 'react';
import { Activity, Clock, Users } from 'lucide-react';

export default function MonitoringStatsCard({
  eventName,
  progress = 0,
  duration = '—',
  durationSub = 'Not started',
  activeStaffCount = 0,
  totalStaffCount = 0,
  isLive = true,
}) {
  return (
    <div className="mon-stats-card">
      <div className="mon-stats-card__header">
        <div className="mon-stats-card__title-group">
          <Activity size={18} className="text-pink" />
          <h3 className="mon-stats-card__title">{eventName || 'Selected Event'}</h3>
        </div>

        {isLive && (
          <span className="live-indicator">
            <span className="live-dot" /> LIVE EXECUTION
          </span>
        )}
      </div>

      <div className="mon-stats-grid">
        {/* Stat 1: Progress */}
        <div className="mon-stat">
          <div className="mon-stat__label">Event Progress</div>
          <div className="mon-stat__value">{progress}%</div>
          <div className="mon-progress-bar">
            <div
              className="mon-progress-fill"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
          <div className="mon-stat__sub" style={{ marginTop: '8px' }}>
            {progress >= 100
              ? 'Event Concluded'
              : progress > 50
              ? 'In Reception / Main Phase'
              : progress > 0
              ? 'Setup & Onboarding'
              : 'Pre-event Readiness'}
          </div>
        </div>

        {/* Stat 2: Duration */}
        <div className="mon-stat">
          <div className="mon-stat__label">
            <Clock size={13} style={{ display: 'inline', marginRight: '4px' }} />
            Active Duration
          </div>
          <div className="mon-stat__value">{duration}</div>
          <div className="mon-stat__sub text-green">{durationSub}</div>
        </div>

        {/* Stat 3: Staff */}
        <div className="mon-stat">
          <div className="mon-stat__label">
            <Users size={13} style={{ display: 'inline', marginRight: '4px' }} />
            On-Site Workforce
          </div>
          <div className="mon-stat__value">
            {activeStaffCount} / {totalStaffCount}
          </div>
          <div className="mon-stat__sub">
            {totalStaffCount > 0 && activeStaffCount === totalStaffCount
              ? '100% Staff Deployed'
              : `${totalStaffCount - activeStaffCount} Standby / En Route`}
          </div>
        </div>
      </div>
    </div>
  );
}

