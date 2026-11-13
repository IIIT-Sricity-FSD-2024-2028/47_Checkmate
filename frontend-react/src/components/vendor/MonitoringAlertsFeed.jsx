import React from 'react';
import { Radio, Info, CheckCircle2, AlertCircle } from 'lucide-react';

export default function MonitoringAlertsFeed({ alerts = [], isSqueezed = false, targetHeight = null }) {
  return (
    <div
      className={`mon-alerts-card ${isSqueezed ? 'mon-alerts-card--squeezed' : ''}`}
      style={
        isSqueezed
          ? {
              height: targetHeight ? `${targetHeight}px` : undefined,
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
            }
          : undefined
      }
    >
      <div className="mon-alerts-card__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Radio size={16} className="text-pink animate-pulse" />
          <h4 style={{ margin: 0, fontSize: isSqueezed ? '14px' : '15px', fontWeight: 700 }}>
            Live Operational Alerts Feed
          </h4>
        </div>
        <span className="live-badge" style={{ padding: '3px 10px', fontSize: '11px' }}>
          <span className="live-dot" /> Real-time Sync
        </span>
      </div>

      <div
        className="mon-alert-list"
        style={
          isSqueezed
            ? {
                flex: 1,
                overflowY: 'auto',
                padding: '12px 16px',
                gap: '8px',
                maxHeight: 'none',
              }
            : undefined
        }
      >
        {alerts.length === 0 ? (
          <div className="mon-empty-sub">No recent live alerts. Stream is running smoothly.</div>
        ) : (
          alerts.map((al) => {
            const type = al.type || 'info';
            return (
              <div
                key={al.id}
                className={`mon-alert-item mon-alert-item--${type}`}
                style={isSqueezed ? { padding: '9px 12px', gap: '10px' } : undefined}
              >
                <div className="mon-alert-item__icon">
                  {type === 'success' ? (
                    <CheckCircle2 size={15} className="text-green" />
                  ) : type === 'warning' ? (
                    <AlertCircle size={15} className="text-yellow" />
                  ) : (
                    <Info size={15} className="text-blue" />
                  )}
                </div>
                <div className="mon-alert-item__body">
                  <div
                    className="mon-alert-item__text"
                    style={isSqueezed ? { fontSize: '12.5px', lineHeight: 1.35 } : undefined}
                  >
                    {al.text}
                  </div>
                  <div
                    className="mon-alert-item__time"
                    style={isSqueezed ? { fontSize: '11px', marginTop: '3px' } : undefined}
                  >
                    {al.time} · {al.source || 'Operations'}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

