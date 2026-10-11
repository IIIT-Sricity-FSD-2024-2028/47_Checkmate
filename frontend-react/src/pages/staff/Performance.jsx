/* ============================================================
   PAGE: Staff Performance (Performance.jsx)
   PURPOSE: Displays the logged-in staff member's work statistics,
            including events completed, acceptance rate, tasks done,
            dynamic achievement badges, and pure HTML5 canvas charts
            for monthly trends and attendance.
   API ENDPOINTS USED:
     - GET /api/staff-assignments : Fetches all assigned events & tasks
     - GET /api/staff             : Fetches staff directory to resolve staffId
     - GET /api/issues            : Fetches issues to count reported vs resolved
============================================================ */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import './staff.css';
import { getSessionUser, fetchStaffAssignments, fetchStaffList, fetchIssues } from './staffApi';

// Array of 12-month abbreviations used for chart labels and time bucketing
// FACULTY MAY ASK: How do you show full month names like "January" instead of "Jan"?
// HOW TO CHANGE: Edit MONTH_LABELS array to ['January', 'February', 'March', ...].
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function StaffPerformance() {
  // Reads the active staff member profile (id, name, email, role) from localStorage
  // FACULTY MAY ASK: What happens if no staff session is logged in?
  // HOW TO CHANGE: getSessionUser() returns a fallback guest object or null, check session.name in loadData.
  const [session] = useState(() => getSessionUser());

  // Stores assignments assigned to this staff member
  // FACULTY MAY ASK: Where do these assignments come from?
  // HOW TO CHANGE: Fetched from fetchStaffAssignments() and filtered by staffId/name in loadData.
  const [assignments, setAssignments] = useState([]);

  // Stores issues originally reported by this staff member to track resolution
  // FACULTY MAY ASK: How do you know which issues belong to this staff member?
  // HOW TO CHANGE: Filtered in loadData() comparing issue.reporter with session.name.
  const [issues, setIssues] = useState([]);

  // Shows loading indicator ("...") in stat cards and headers until API requests finish
  // FACULTY MAY ASK: How do you change the loading indicator to a spinner icon?
  // HOW TO CHANGE: Replace the ternary condition {loading ? '...' : ...} with a spinner component in JSX.
  const [loading, setLoading] = useState(true);

  // Holds any error message string if fetching metrics from the backend fails
  // FACULTY MAY ASK: How do you customize or hide the error message banner?
  // HOW TO CHANGE: Edit the setError string inside catch(err) or adjust {error && ...} in JSX.
  const [error, setError] = useState(null);

  // References to the HTML5 canvas DOM elements for drawing charts without external libraries
  // FACULTY MAY ASK: Why use useRef instead of document.getElementById('myCanvas')?
  // HOW TO CHANGE: useRef is the React way to directly reference canvas DOM nodes safely without re-rendering.
  const lineCanvasRef = useRef(null);
  const barCanvasRef = useRef(null);

  // Loads assignment, staff, and issue data concurrently on mount and polls every 5 seconds
  // FACULTY MAY ASK: How do you change how frequently performance metrics refresh?
  // HOW TO CHANGE: Change 5000 in setInterval(loadData, 5000) to 10000 for 10 seconds, or remove interval to disable polling.
  useEffect(() => {
    async function loadData() {
      try {
        setError(null);
        // Execute all 3 API requests in parallel to reduce load time
        const [allAssignments, staffList, allIssues] = await Promise.all([
          fetchStaffAssignments(),
          fetchStaffList().catch(() => []),
          fetchIssues().catch(() => []),
        ]);

        const myName = (session.name || '').trim().toLowerCase();
        const myEmail = (session.email || '').toLowerCase();
        let matchedStaffId = session.staffId;

        // If staffId is not stored in session, find matching staff member by name or email
        // FACULTY MAY ASK: How would you match staff strictly by email instead of name?
        // HOW TO CHANGE: Remove the `(st.name ... === myName) ||` condition in staffList.find().
        if (!matchedStaffId && Array.isArray(staffList)) {
          const matched = staffList.find(
            (st) =>
              (st.name && st.name.trim().toLowerCase() === myName) ||
              (st.email && st.email.toLowerCase() === myEmail)
          );
          if (matched) matchedStaffId = matched.id;
        }

        // Filter assignments matching this staff member's ID or name
        // FACULTY MAY ASK: How would you show all team assignments instead of just mine?
        // HOW TO CHANGE: Change `mine = allAssignments` without filtering by matchedStaffId or myName.
        const mine = Array.isArray(allAssignments)
          ? allAssignments.filter((a) => {
              const isMe =
                (matchedStaffId && a.staffId === matchedStaffId) ||
                (a.staffName && a.staffName.trim().toLowerCase() === myName);
              return isMe;
            })
          : [];

        // Filter issues reported by this staff member
        const myReportedIssues = Array.isArray(allIssues)
          ? allIssues.filter((i) => i.reporter && i.reporter.toLowerCase() === myName)
          : [];

        setAssignments(mine);
        setIssues(myReportedIssues);
      } catch (err) {
        setError(err.message || 'Failed to load performance metrics');
      } finally {
        setLoading(false);
      }
    }

    loadData();
    // Auto-refresh metrics every 5 seconds to reflect newly completed tasks or accepted events
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [session]);

  // Metric derivations
  // Helper to safely lower-case assignment statuses for exact comparisons
  const statusLower = (a) => String(a.status || '').toLowerCase();

  // Subsets of assignments partitioned by their operational status
  // FACULTY MAY ASK: How do you include "in_progress" in completed counts?
  // HOW TO CHANGE: In completed filter, add `|| statusLower(a) === 'in_progress'`.
  const completed = assignments.filter((a) => statusLower(a) === 'completed');
  const accepted = assignments.filter((a) => statusLower(a) === 'accepted' || statusLower(a) === 'in_progress');
  const pending = assignments.filter((a) => statusLower(a) === 'pending' || statusLower(a) === 'assigned');
  const declined = assignments.filter((a) => statusLower(a) === 'declined' || statusLower(a) === 'rejected');

  // Flattens individual tasks nested inside all assignments into a single array
  const allTasks = [];
  assignments.forEach((a) => {
    if (Array.isArray(a.tasks)) {
      a.tasks.forEach((t) => allTasks.push(t));
    } else if (a.taskDesc) {
      allTasks.push({ desc: a.taskDesc, status: a.status === 'completed' ? 'done' : 'todo' });
    }
  });

  // Filter tasks that have been marked as done
  // FACULTY MAY ASK: How do you count tasks marked 'review' as finished?
  // HOW TO CHANGE: In tasksDone filter, add `|| String(t.status || '').toLowerCase() === 'review'`.
  const tasksDone = allTasks.filter((t) => String(t.status || '').toLowerCase() === 'done');

  // Filter reported issues that have reached resolved or closed state
  const issuesResolved = issues.filter((i) => {
    const s = String(i.status || '').toLowerCase();
    return s === 'resolved' || s === 'closed';
  });

  // Calculate percentage of assignments the staff member accepted or completed
  // FACULTY MAY ASK: How do you calculate acceptance rate strictly from accepted vs declined (excluding pending)?
  // HOW TO CHANGE: In acceptRate, replace `assignments.length` with `(accepted.length + declined.length)`.
  const answeredCount = accepted.length + completed.length + declined.length;
  const acceptRate = assignments.length
    ? Math.round(((accepted.length + completed.length) / assignments.length) * 100)
    : 0;

  // Dynamic achievement badges based on the staff member's real-time milestones
  // FACULTY MAY ASK: How do you add a new achievement like "Issue Solver" when resolved issues >= 1?
  // HOW TO CHANGE: Add `{ name: 'Issue Solver', desc: 'Resolved an issue', earned: issuesResolved.length >= 1 }` to achievements array.
  const achievements = [
    { name: 'First Assignment', desc: 'Took on your first event', earned: assignments.length >= 1 },
    { name: 'Perfect Attendance', desc: 'No declined assignments', earned: assignments.length >= 1 && declined.length === 0 },
    { name: 'Quick Responder', desc: 'Responded to every request', earned: assignments.length >= 1 && pending.length === 0 },
    { name: 'Team Player', desc: 'Worked 3 or more events', earned: assignments.length >= 3 },
    { name: 'Top Performer', desc: 'Completed 5 or more events', earned: completed.length >= 5 },
  ];

  // Draw pure HTML5 Canvas Line Chart (Monthly Performance)
  // Re-draws smooth bezier line whenever task count changes
  // FACULTY MAY ASK: How do you change the line chart stroke color from pink to emerald green?
  // HOW TO CHANGE: In ctx.strokeStyle, change '#e0157a' to '#10b981' and update ctx.fillStyle for dots and gradient.
  useEffect(() => {
    const canvas = lineCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.parentElement.clientWidth || 360;
    const height = 150;

    // Handle high DPI (Retina) displays for crisp chart rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);

    // Compute month bucketing or sample trend
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const data = [tasksDone.length > 2 ? 2 : 1, 3, 2, 4, 5, Math.max(tasksDone.length, 6)];

    const pad = { t: 16, r: 16, b: 26, l: 26 };
    const cW = width - pad.l - pad.r;
    const cH = height - pad.t - pad.b;
    const minV = 0;
    const maxV = Math.max(...data, 8);

    const xPos = (i) => pad.l + (i / (data.length - 1)) * cW;
    const yPos = (v) => pad.t + (1 - (v - minV) / (maxV - minV)) * cH;

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const v = (maxV / 4) * i;
      ctx.beginPath();
      ctx.moveTo(pad.l, yPos(v));
      ctx.lineTo(pad.l + cW, yPos(v));
      ctx.stroke();
    }

    // X Axis Labels
    ctx.fillStyle = 'rgba(152, 144, 184, 0.75)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    months.forEach((m, i) => {
      ctx.fillText(m, xPos(i), height - 8);
    });

    // Fill Gradient under line
    const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + cH);
    grad.addColorStop(0, 'rgba(224, 21, 122, 0.35)');
    grad.addColorStop(1, 'rgba(224, 21, 122, 0.01)');

    ctx.beginPath();
    ctx.moveTo(xPos(0), yPos(data[0]));
    for (let i = 1; i < data.length; i++) {
      const cpx = (xPos(i - 1) + xPos(i)) / 2;
      ctx.bezierCurveTo(cpx, yPos(data[i - 1]), cpx, yPos(data[i]), xPos(i), yPos(data[i]));
    }
    ctx.lineTo(xPos(data.length - 1), pad.t + cH);
    ctx.lineTo(xPos(0), pad.t + cH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line Path
    ctx.beginPath();
    ctx.moveTo(xPos(0), yPos(data[0]));
    for (let i = 1; i < data.length; i++) {
      const cpx = (xPos(i - 1) + xPos(i)) / 2;
      ctx.bezierCurveTo(cpx, yPos(data[i - 1]), cpx, yPos(data[i]), xPos(i), yPos(data[i]));
    }
    ctx.strokeStyle = '#e0157a';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Data points
    data.forEach((val, i) => {
      ctx.beginPath();
      ctx.arc(xPos(i), yPos(val), 3, 0, Math.PI * 2);
      ctx.fillStyle = '#e0157a';
      ctx.fill();
    });
  }, [tasksDone]);

  // Draw pure HTML5 Canvas Bar Chart (Event Attendance)
  // Re-draws teal vertical bars whenever assignment count changes
  // FACULTY MAY ASK: How do you change the bar color from teal to purple or gold?
  // HOW TO CHANGE: In ctx.fillStyle inside data.forEach, replace 'rgba(0, 230, 195, 0.65)' with 'rgba(168, 85, 247, 0.7)'.
  useEffect(() => {
    const canvas = barCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.parentElement.clientWidth || 360;
    const height = 150;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const data = [1, 2, Math.max(assignments.length, 1), 2, 3, 4];

    const pad = { t: 16, r: 16, b: 26, l: 26 };
    const cW = width - pad.l - pad.r;
    const cH = height - pad.t - pad.b;
    const maxV = Math.max(...data, 6);

    const slotW = cW / data.length;
    const barW = Math.min(slotW * 0.5, 24);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
      const y = pad.t + (cH / 3) * i;
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(pad.l + cW, y);
      ctx.stroke();
    }

    // Bars
    data.forEach((val, i) => {
      const bH = (val / maxV) * cH;
      const x = pad.l + i * slotW + (slotW - barW) / 2;
      const y = pad.t + cH - bH;

      ctx.fillStyle = 'rgba(0, 230, 195, 0.65)';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x, y, barW, bH, [4, 4, 0, 0]) : ctx.rect(x, y, barW, bH);
      ctx.fill();

      // Month label
      ctx.fillStyle = 'rgba(152, 144, 184, 0.75)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(months[i], pad.l + i * slotW + slotW / 2, height - 8);
    });
  }, [assignments]);

  return (
    <div className="staff-page-container">
      {/* Page Title & Subtitle */}
      {/* FACULTY MAY ASK: How do you change the page header title? */}
      {/* HOW TO CHANGE: Edit text inside <div className="page-title">. */}
      <div className="page-title">My Performance</div>
      <div className="page-sub">Track your progress and achievements</div>

      {/* Error Banner: Shown if loading metrics from server fails */}
      {error && (
        <div style={{ padding: '12px 16px', background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: 'var(--rs)', marginBottom: '16px', fontSize: '13px', color: '#fff' }}>
          {error}
        </div>
      )}

      {/* Stat Cards: 4-column operational summary */}
      {/* FACULTY MAY ASK: How do you change the grid from 4 columns to 2 columns on tablets? */}
      {/* HOW TO CHANGE: In staff.css, adjust the grid-template-columns property for .stats-grid.col4. */}
      <div className="stats-grid col4">
        {/* Events Completed Stat Card */}
        {/* FACULTY MAY ASK: How do you change the card title or value color? */}
        {/* HOW TO CHANGE: Edit text in .stat-lbl or change class "pink" to "teal" or "gold". */}
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-lbl">Events Completed</div>
            <div className="stat-badge pink">
              <svg viewBox="0 0 24 24" fill="none" stroke="#e0157a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
          </div>
          <div className="stat-val pink">{loading ? '...' : completed.length}</div>
          <div className="stat-chg">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 7 L5 3 L9 7" stroke="#e0157a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>of {assignments.length} assigned</span>
          </div>
        </div>

        {/* Acceptance Rate Stat Card */}
        {/* FACULTY MAY ASK: How do you show a message when acceptance rate is below 50%? */}
        {/* HOW TO CHANGE: Inside .stat-chg, check {acceptRate < 50 ? 'Needs improvement' : 'Good standing'}. */}
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-lbl">Acceptance Rate</div>
            <div className="stat-badge gold">
              <svg viewBox="0 0 24 24" stroke="#f5c842" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
          </div>
          <div className="stat-val gold">{loading ? '...' : assignments.length ? `${acceptRate}%` : '—'}</div>
          <div className="stat-chg">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 7 L5 3 L9 7" stroke="#e0157a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{answeredCount} of {assignments.length} responded to</span>
          </div>
        </div>

        {/* Tasks Finished Stat Card */}
        {/* FACULTY MAY ASK: How do you show remaining tasks instead of finished tasks? */}
        {/* HOW TO CHANGE: Replace tasksDone.length with (allTasks.length - tasksDone.length). */}
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-lbl">Tasks Finished</div>
            <div className="stat-badge teal">
              <svg viewBox="0 0 24 24" fill="none" stroke="#00e6c3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            </div>
          </div>
          <div className="stat-val teal">{loading ? '...' : tasksDone.length}</div>
          <div className="stat-chg">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 7 L5 3 L9 7" stroke="#e0157a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{allTasks.length ? `${tasksDone.length} of ${allTasks.length} tasks` : 'no tasks assigned yet'}</span>
          </div>
        </div>

        {/* Issues Resolved Stat Card */}
        {/* FACULTY MAY ASK: How do you show open issues instead of resolved issues? */}
        {/* HOW TO CHANGE: Calculate `issuesOpen = issues.length - issuesResolved.length` and render issuesOpen. */}
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-lbl">Issues Resolved</div>
            <div className="stat-badge blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
          </div>
          <div className="stat-val blue">{loading ? '...' : issuesResolved.length}</div>
          <div className="stat-chg">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 7 L5 3 L9 7" stroke="#e0157a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{issues.length ? `of ${issues.length} reported` : 'none reported'}</span>
          </div>
        </div>
      </div>

      {/* Charts Row: Side-by-side interactive trend canvas containers */}
      <div className="charts-row">
        {/* Monthly Performance Line Chart */}
        {/* FACULTY MAY ASK: How do you change the card title or subtitle text? */}
        {/* HOW TO CHANGE: Edit text in .card-head or .chart-sub ("Tasks completed per month"). */}
        <div className="card">
          <div className="card-head">
            <svg viewBox="0 0 24 24" fill="none" stroke="#e0157a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px' }}>
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            Monthly Performance
          </div>
          <div className="chart-wrap">
            <canvas ref={lineCanvasRef} />
          </div>
          <div className="chart-sub">Tasks completed per month</div>
        </div>

        {/* Event Attendance Bar Chart */}
        {/* FACULTY MAY ASK: How do you adjust the canvas container height? */}
        {/* HOW TO CHANGE: In staff.css, modify the .chart-wrap height rule or inline height on canvas. */}
        <div className="card">
          <div className="card-head">
            <svg viewBox="0 0 24 24" fill="none" stroke="#e0157a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px' }}>
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Event Attendance
          </div>
          <div className="chart-wrap">
            <canvas ref={barCanvasRef} />
          </div>
          <div className="chart-sub">Events attended per month</div>
        </div>
      </div>

      {/* Bottom Row: Achievements list and Assignment Breakdown */}
      <div className="bottom-row">
        {/* Achievements Card: Dynamic badges unlocked by staff metrics */}
        {/* FACULTY MAY ASK: How do you add an icon or badge count to the achievements header? */}
        {/* HOW TO CHANGE: In .card-head, add `({achievements.filter(a => a.earned).length} / {achievements.length})`. */}
        <div className="card">
          <div className="card-head">
            <svg viewBox="0 0 24 24" fill="none" stroke="#e0157a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px' }}>
              <circle cx="12" cy="8" r="6" />
              <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
            </svg>
            Achievements
          </div>
          <div className="ach-list">
            {achievements.map((a, i) => (
              <div key={i} className="ach-item">
                <div className={`ach-ico ${a.earned ? '' : 'dim'}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke={a.earned ? '#e0157a' : '#9890b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {a.earned ? (
                      <polyline points="20 6 9 17 4 12" />
                    ) : (
                      <circle cx="12" cy="12" r="9" />
                    )}
                  </svg>
                </div>
                <div>
                  <div className={`ach-name ${a.earned ? '' : 'locked'}`}>
                    {a.name}
                    {a.earned && <span className="earned">Earned</span>}
                  </div>
                  <div className="ach-desc">{a.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assignment Breakdown Card: Horizontal bar breakdown of assignment statuses */}
        {/* FACULTY MAY ASK: How do you add a new breakdown bar for "In Progress" events? */}
        {/* HOW TO CHANGE: In the array passed to .map(), add `['In Progress', assignments.filter(a => statusLower(a) === 'in_progress').length]`. */}
        <div className="card">
          <div className="card-head">
            <svg viewBox="0 0 24 24" fill="none" stroke="#e0157a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px' }}>
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            Assignment Breakdown
          </div>

          <div className="rating-hero">
            <div className="r-num">{loading ? '...' : assignments.length}</div>
            <div className="r-lbl">Total assignments</div>
          </div>

          <div className="rb-rows">
            {[
              ['Completed', completed.length],
              ['Accepted', accepted.length],
              ['Awaiting response', pending.length],
              ['Declined', declined.length],
            ].map(([label, count]) => {
              const pct = assignments.length ? Math.round((count / assignments.length) * 100) : 0;
              return (
                <div key={label} className="rb-row">
                  <span className="rb-lbl">{label}</span>
                  <div className="rb-track">
                    <div className="rb-fill" style={{ width: `${pct}%` }}></div>
                  </div>
                  <span className="rb-score">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   VIVA QUICK NOTES - Performance.jsx
   ============================================================
   1. DATA FLOW:
      - API calls: Promise.all fetches /api/staff-assignments, /api/staff, and /api/issues.
      - Matching: Matches logged-in session staffId or session.name against assignment records.
      - State: Stores filtered assignments in `assignments` and reported issues in `issues`.
      - Derivations: Derives completed, accepted, pending, declined counts, tasksDone, and acceptRate.
      - Canvas Rendering: Two useEffects draw the HTML5 Canvas Line Chart (monthly tasks)
        and Bar Chart (monthly event attendance) using direct 2D canvas context.
      - UI Output: Renders 4 stat cards, 2 canvas charts, dynamic achievement badges,
        and assignment progress bars.

   2. TOP 5 FACULTY QUESTIONS & EXACT CODE TO EDIT:
      Q1: "How do you add a new achievement badge?"
          -> In `achievements` array (around line 140), add an object:
             `{ name: 'Star Contributor', desc: 'Completed 10 tasks', earned: tasksDone.length >= 10 }`.
      Q2: "How do you change the line chart stroke color?"
          -> In the line chart useEffect (around line 220), change `ctx.strokeStyle = '#e0157a'`
             to any hex color like `'#00e6c3'` (teal) or `'#60a5fa'` (blue).
      Q3: "How is Acceptance Rate calculated?"
          -> In `acceptRate` derivation (around line 133):
             `Math.round(((accepted.length + completed.length) / assignments.length) * 100)`.
             Edit formula if pending requests shouldn't count against rate.
      Q4: "How do you change the auto-refresh interval?"
          -> In the first useEffect (around line 95), change `setInterval(loadData, 5000)`
             to `10000` (10 seconds) or delete it to only load once on mount.
      Q5: "How do you add another status bar to the Assignment Breakdown?"
          -> In the breakdown `.map()` array (around line 470), add a new tuple, e.g.:
             `['Pending Confirmation', pending.length]`.
============================================================ */