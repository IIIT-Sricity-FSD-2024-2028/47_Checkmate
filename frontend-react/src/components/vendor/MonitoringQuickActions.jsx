import React from 'react';
import { Activity, Package, UserCheck, CheckCircle2 } from 'lucide-react';

export default function MonitoringQuickActions({
  onUpdateEvent,
  onAllocateResources,
  onAllocateStaff,
  onEndEvent,
  isEnding = false,
}) {
  return (
    <div className="mon-actions">
      <button
        type="button"
        className="mon-action-btn mon-action-btn--update"
        onClick={onUpdateEvent}
        title="Broadcast live status announcement or milestone alert"
      >
        <Activity size={20} />
        <span>Update Bulletin</span>
      </button>

      <button
        type="button"
        className="mon-action-btn mon-action-btn--allocate"
        onClick={onAllocateResources}
        title="Dispatch reserve equipment or extra furniture to the venue"
      >
        <Package size={20} />
        <span>Allocate Resources</span>
      </button>

      <button
        type="button"
        className="mon-action-btn mon-action-btn--staff"
        onClick={onAllocateStaff}
        title="Deploy additional coordinator or technician on-site"
      >
        <UserCheck size={20} />
        <span>Deploy Extra Staff</span>
      </button>

      <button
        type="button"
        className="mon-action-btn mon-action-btn--end"
        onClick={onEndEvent}
        disabled={isEnding}
        title="Conclude event operations and mark as completed"
      >
        <CheckCircle2 size={20} />
        <span>{isEnding ? 'Finalizing...' : 'Conclude Event'}</span>
      </button>
    </div>
  );
}

