import React from 'react';
import { Users } from 'lucide-react';

const LABELS = {
  on_site: 'On Site',
  working: 'Working',
  on_break: 'On Break',
  finished: 'Finished',
};
const STATUS_CLASS = { on_site: 'risk', working: 'safe', on_break: 'risk', finished: 'safe' };

function taskCounts(member) {
  const tasks = Array.isArray(member.tasks) ? member.tasks : [];
  return { done: tasks.filter((t) => t.status === 'done').length, total: tasks.length };
}

/** What each person on the event last reported, plus their Task Board progress. */
export default function MonitoringStaffProgress({ team = [] }) {
  return (
    <div className="mon-requests">
      <div className="mon-requests__header">
        <Users size={16} className="text-cyan" />
        <h4>Staff Progress</h4>
        {team.length > 0 && <span className="mon-counter-badge">{team.length}</span>}
      </div>

      <div className="mon-requests__list">
        {team.length === 0 && <div className="mon-empty-sub">No staff assigned to this event.</div>}
        {team.map((member) => {
          const { done, total } = taskCounts(member);
          return (
            <div key={member.id} className="mon-progress-item">
              <div className="mon-progress-item__top">
                <span className="mon-progress-item__name">{member.staffName}</span>
                <span className={`row-status ${STATUS_CLASS[member.workStatus] || 'critical'}`}>
                  {LABELS[member.workStatus] || 'No update yet'}
                </span>
              </div>
              <div className="mon-progress-item__meta">
                {member.role || 'Staff'}
                {total > 0 && ` · ${done} of ${total} tasks done`}
                {member.progressUpdatedAt &&
                  ` · ${new Date(member.progressUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
              </div>
              {member.progressNote && <div className="mon-progress-item__note">{member.progressNote}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
