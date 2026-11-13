/**
 * Lets staff on a live event report how their work is going. The vendor sees
 * this in Live Monitoring.
 */

import React, { useState } from 'react';
import { updateStaffProgress } from '../../../services/staffApi';

const OPTIONS = [
  { value: 'on_site', label: 'On Site' },
  { value: 'working', label: 'Working' },
  { value: 'on_break', label: 'On Break' },
  { value: 'finished', label: 'Finished' },
];

export default function StaffProgressPanel({ assignment, onSaved, onError }) {
  const [workStatus, setWorkStatus] = useState(assignment.workStatus || '');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateStaffProgress(assignment.id, { workStatus, note: note.trim() || undefined });
      setNote('');
      onSaved(updated);
    } catch (err) {
      onError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sp-panel">
      <div className="sp-title">My Progress</div>
      <div className="sp-options" role="radiogroup" aria-label="My progress">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={workStatus === option.value}
            className={`sp-option ${workStatus === option.value ? 'selected' : ''}`}
            onClick={() => setWorkStatus(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="sp-row">
        <input
          type="text"
          className="sp-note"
          maxLength={200}
          placeholder="Add a short update (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button type="button" className="sp-save" disabled={!workStatus || saving} onClick={handleSave}>
          {saving ? 'Sending...' : 'Send Update'}
        </button>
      </div>
      {assignment.progressNote && <div className="sp-last">Last update: {assignment.progressNote}</div>}
    </div>
  );
}
