import React from 'react';
import { Check, Clock, ChevronRight } from 'lucide-react';

export default function MonitoringTimeline({ milestones = [], onAdvanceMilestone }) {
  return (
    <div className="mon-timeline-card">
      <div className="mon-timeline-card__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={16} className="text-pink" />
          <h3 style={{ margin: 0 }}>Event Operational Milestones</h3>
        </div>

        {onAdvanceMilestone && (
          <button
            type="button"
            className="mon-advance-btn"
            onClick={onAdvanceMilestone}
            title="Advance to next operational milestone"
          >
            <span>Advance Next</span>
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      <div className="timeline">
        {milestones.length === 0 ? (
          <div className="mon-empty-sub">No milestone stages configured for this event.</div>
        ) : (
          milestones.map((m, idx) => {
            const isDone = m.status === 'done';
            const isCurrent = m.status === 'current';

            return (
              <div
                key={m.id || idx}
                className={`tl-item ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}
              >
                {/* Vertical connector line */}
                {idx < milestones.length - 1 && <div className="tl-line" />}

                {/* Circle Icon */}
                <div
                  className={`tl-icon ${
                    isDone
                      ? 'tl-icon--done'
                      : isCurrent
                      ? 'tl-icon--current'
                      : 'tl-icon--pending'
                  }`}
                >
                  {isDone ? (
                    <Check size={14} />
                  ) : isCurrent ? (
                    <span className="live-dot" style={{ width: '8px', height: '8px' }} />
                  ) : (
                    <span style={{ fontSize: '11px', fontWeight: 600 }}>{idx + 1}</span>
                  )}
                </div>

                {/* Stage Info */}
                <div className="tl-body">
                  <div className="tl-title">
                    <span>{m.title}</span>
                    {isCurrent && <span className="tl-current-tag">ACTIVE STAGE</span>}
                  </div>
                  <div className="tl-time">
                    {m.time} {m.lead ? `· Lead: ${m.lead}` : ''}
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

