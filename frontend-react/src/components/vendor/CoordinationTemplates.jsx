import React from 'react';
import { Sparkles } from 'lucide-react';

const DEFAULT_TEMPLATES = [
  'Setup commencing now. All teams please report to designated zones.',
  'Lead client has arrived at reception foyer. Standby for briefing.',
  'Audio & visual checks 100% complete. Stage is ready.',
  'Schedule is running 10 minutes ahead. Great work team.',
  'Need 1 coordinator backup at Registration Desk B immediately.',
  'Event concluded successfully. Proceed with inventory teardown.',
];

export default function CoordinationTemplates({ onSelectTemplate }) {
  return (
    <div className="ch-templates">
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
        <Sparkles size={14} className="text-yellow" />
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Quick Operational Templates:
        </span>
      </div>

      <div className="ch-template-chips">
        {DEFAULT_TEMPLATES.map((tmpl, idx) => (
          <button
            key={idx}
            type="button"
            className="ch-template-chip"
            onClick={() => onSelectTemplate(tmpl)}
            title="Click to insert template into message box"
          >
            {tmpl}
          </button>
        ))}
      </div>
    </div>
  );
}

