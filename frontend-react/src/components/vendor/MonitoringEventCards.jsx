import React from 'react';
import { PlayCircle, Radio, Clock, MapPin } from 'lucide-react';

export default function MonitoringEventCards({ events, selectedEventId, onSelectEvent }) {
  if (!events || events.length === 0) {
    return (
      <div className="mon-empty-state">
        <Radio size={20} className="text-muted" />
        <span>No active or confirmed events currently available for live monitoring.</span>
      </div>
    );
  }

  return (
    <div className="mon-event-grid">
      {events.map((ev) => {
        const isSelected = ev.id === selectedEventId;
        const isLive = String(ev.status || '').toLowerCase() === 'live';

        return (
          <div
            key={ev.id}
            className={`mon-event-card ${isSelected ? 'active' : ''}`}
            onClick={() => onSelectEvent(ev)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onSelectEvent(ev);
            }}
          >
            <div className="mon-event-card__header">
              <div className="mon-event-card__title">
                {isLive ? (
                  <Radio size={16} className="text-pink animate-pulse" />
                ) : (
                  <PlayCircle size={16} className="text-muted" />
                )}
                <span>{ev.name || ev.title || 'Event'}</span>
              </div>

              {isLive ? (
                <span className="mon-live-tag">
                  <span className="live-dot" /> LIVE
                </span>
              ) : (
                <span className="mon-scheduled-tag">{ev.status || 'Scheduled'}</span>
              )}
            </div>

            <div className="mon-event-card__details">
              <span className="mon-meta-item">
                <Clock size={12} />
                {ev.date || 'Today'} · {ev.time || '18:00'}
              </span>
              <span className="mon-meta-item">
                <MapPin size={12} />
                {ev.venue || 'Grand Ballroom'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

