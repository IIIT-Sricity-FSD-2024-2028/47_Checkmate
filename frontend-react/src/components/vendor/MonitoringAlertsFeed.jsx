import React from 'react';
import { Radio, Info, CheckCircle2, AlertCircle } from 'lucide-react';

export default function MonitoringAlertsFeed({ alerts = [] }) {
  return (
    <div className="mon-alerts-card">
      <div className="mon-alerts-card__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Radio size={16} className="text-pink animate-pulse" />
          <h3 style={{ margin: 0 }}>Live Operational Alerts Feed</h3>
        </div>
        <span className="live-badge" style={{ padding: '3px 10px', fontSize: '11px' }}>
          <span className="live-dot" /> Real-time Sync
        </span>
      </div>

      <div className="mon-alert-list">
        {alerts.length === 0 ? (
          <div className="mon-empty-sub">No recent live alerts. Stream is running smoothly.</div>
        ) : (
          alerts.map((al) => {
            const type = al.type || 'info';
            return (
              <div key={al.id} className={`mon-alert-item mon-alert-item--${type}`}>
                <div className="mon-alert-item__icon">
                  {type === 'success' ? (
                    <CheckCircle2 size={16} className="text-green" />
                  ) : type === 'warning' ? (
                    <AlertCircle size={16} className="text-yellow" />
                  ) : (
                    <Info size={16} className="text-blue" />
                  )}
                </div>
                <div className="mon-alert-item__body">
                  <div className="mon-alert-item__text">{al.text}</div>
                  <div className="mon-alert-item__time">{al.time} · {al.source || 'Operations'}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

