/**
 * ============================================================================
 * LIVE TASK PROGRESS CARD (LiveTaskProgressCard.jsx)
 * ============================================================================
 * Role: Reusable Component (Client Live Monitoring page)
 * Location: src/components/client/LiveTaskProgressCard.jsx
 *
 * Purpose:
 *   Shows how many staff tasks are finished (progress bar + "x/y tasks") and
 *   lists every task as a timeline: green tick = done, spinner = still pending.
 *
 * Props:
 *   @param {Array} tasks - [{ id, desc, status, staffName }]
 *   @param {number} doneCount - Finished tasks
 *   @param {number} taskPercent - 0–100
 * ============================================================================
 */

import React from "react";
import { Check, Clock, Loader2 } from "lucide-react";

function LiveTaskProgressCard({ tasks = [], doneCount = 0, taskPercent = 0 }) {
  return (
    <div className="card">
      <div className="cl-card-title"><Clock size={18} /> Live Task Progress</div>

      {/* ── Overall completion bar ── */}
      <div className="cl-next-event">
        <div className="cl-progress-label">
          <span>Overall Completion ({doneCount}/{tasks.length} tasks)</span>
          <span className="cl-progress-pct">{taskPercent}%</span>
        </div>
        <div className="cl-progress-track">
          <div className="cl-progress-fill" style={{ width: `${taskPercent}%` }} />
        </div>
      </div>

      {tasks.length === 0 && <div className="cl-client-muted">No staff tasks have been created for this event yet.</div>}

      {/* ── One timeline row per task ── */}
      <div className="cl-timeline">
        {tasks.map((task, index) => {
          const done = task.status === "done";
          return (
            <div className={`cl-tl-item ${done ? "completed" : "in-progress"}`} key={task.id || index}>
              <div className="cl-tl-icon-col">
                <div className="cl-tl-icon">{done ? <Check size={14} /> : <Loader2 size={14} className="cl-spin" />}</div>
                {index < tasks.length - 1 && <div className="cl-tl-line active" />}
              </div>
              <div>
                <div className="cl-tl-title">{task.desc || task.text || "Task"}</div>
                <div className="cl-tl-desc">{task.staffName} • {done ? "Completed" : "Pending"}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LiveTaskProgressCard;
