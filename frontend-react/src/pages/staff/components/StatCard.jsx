import React from 'react';

/**
 * Reusable StatCard for EventPro Staff module
 */
export default function StatCard({
  label,
  value,
  subtext,
  icon,
  iconClass = 'ico-pink',
  valueClass = '',
}) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        <div className={`stat-ico ${iconClass}`}>{icon}</div>
      </div>
      <div className={`stat-val ${valueClass}`}>{value}</div>
      {subtext && <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{subtext}</div>}
    </div>
  );
}
