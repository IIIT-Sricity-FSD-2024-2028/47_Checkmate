import React from 'react';
import { AlertCircle, ShieldAlert, Send } from 'lucide-react';

const CATEGORIES = [
  'Resource / Equipment Defect',
  'Staffing / Attendance Shortage',
  'Venue / Facility Issue',
  'Technical / AV Malfunction',
  'Schedule / Timeline Delay',
  'Client Requirement Dispute',
  'Billing / Financial Discrepancy',
  'Other Operational Concern',
];

const PRIORITIES = [
  { id: 'low', label: 'Low', color: 'blue' },
  { id: 'medium', label: 'Medium', color: 'yellow' },
  { id: 'high', label: 'High', color: 'orange' },
  { id: 'critical', label: 'Critical', color: 'red' },
];

export default function ReportIssueForm({
  target = 'event',
  events = [],
  title,
  setTitle,
  category,
  setCategory,
  priority,
  setPriority,
  eventId,
  setEventId,
  description,
  setDescription,
  reporterName,
  reporterEmail,
  onSubmit,
  isSubmitting = false,
}) {
  const maxChars = 800;
  const charsLeft = maxChars - (description ? description.length : 0);

  return (
    <div className="ri-card">
      <div className="ri-card__header">
        <div className="ri-header-icon">
          {target === 'admin' ? <ShieldAlert size={20} /> : <AlertCircle size={20} />}
        </div>
        <div className="ri-header-text">
          <h3>
            {target === 'admin'
              ? 'Submit Escalation to Super Admin'
              : 'Report Operational Incident on Event'}
          </h3>
          <p>
            {target === 'admin'
              ? 'Report contractual, account, or platform level moderation incidents directly to Checkmate administrators.'
              : 'Log active disruptions, missing assets, or staff emergencies for immediate resolution tracking.'}
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="ri-body">
        {/* Reporter Info Card */}
        <div className="ri-reporter">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Submitting Coordinator
            </span>
            <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {reporterName || 'Sarah Williams'}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginLeft: 'auto', textAlign: 'right' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Email
            </span>
            <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              {reporterEmail || 'sarah@eliteevents.com'}
            </span>
          </div>
        </div>

        {/* Issue Title */}
        <div className="ri-form-group">
          <label className="ri-label">Subject / Incident Summary *</label>
          <input
            type="text"
            className="ri-input"
            placeholder="e.g. Stage B audio amplifier overheating during rehearsal"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* Row: Category & Priority */}
        <div className="ri-row">
          <div className="ri-form-group">
            <label className="ri-label">Category *</label>
            <div className="ri-select-wrap">
              <select
                className="ri-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="ri-form-group">
            <label className="ri-label">Urgency / Priority *</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {PRIORITIES.map((p) => {
                const isSelected = priority === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`ri-priority-btn ${isSelected ? `selected selected--${p.color}` : ''}`}
                    onClick={() => setPriority(p.id)}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Related Event (if target === 'event') */}
        {target === 'event' && (
          <div className="ri-form-group">
            <label className="ri-label">Associated Event *</label>
            <div className="ri-select-wrap">
              <select
                className="ri-select"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                required
              >
                <option value="">-- Choose an Event --</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name || ev.title} ({ev.date || 'TBA'})
                  </option>
                ))}
                <option value="GENERAL">General Operational / Non-Event Specific</option>
              </select>
            </div>
          </div>
        )}

        {/* Detailed Description */}
        <div className="ri-form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="ri-label">Detailed Incident Description *</label>
            <span style={{ fontSize: '11px', color: charsLeft < 50 ? '#ef4444' : 'var(--text-muted)' }}>
              {charsLeft} characters remaining
            </span>
          </div>
          <textarea
            className="ri-textarea"
            placeholder="Describe what occurred, impacted areas, immediate steps taken, and required assistance..."
            value={description}
            onChange={(e) => {
              if (e.target.value.length <= maxChars) {
                setDescription(e.target.value);
              }
            }}
            required
          />
        </div>

        {/* Submit Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
          <button
            type="submit"
            className="ri-submit"
            disabled={isSubmitting}
            title="Submit incident ticket"
          >
            <Send size={15} />
            <span>{isSubmitting ? 'Transmitting Ticket...' : 'Submit Incident Ticket'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

