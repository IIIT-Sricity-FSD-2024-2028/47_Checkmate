/**
 * PAGE: AssignedEvents.jsx
 * WHAT IT DOES:
 *   Displays all event assignments dispatched to this staff member by vendors.
 *   Provides summary metric cards (Total, Pending, Accepted, Rejected), a status
 *   filter bar (All, Pending, Accepted, Rejected), and rich event cards allowing staff
 *   to accept or reject invitations and inspect assigned subtasks.
 *
 * APIS USED:
 *   - GET   /api/staff-assignments      -> loads all assignments to filter for this user
 *   - GET   /api/staff                  -> matches staff ID and profile details
 *   - PATCH /api/staff-assignments/:id  -> updates assignment status to 'accepted' or 'rejected'
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/staff.css';
import StatCard from './components/StatCard';
import Toast from './components/Toast';
import { getSessionUser, fetchStaffAssignments, fetchStaffList, updateStaffAssignment } from '../../services/staffApi';

// Array of vibrant gradients applied cyclically across event card banners
// FACULTY MAY ASK: How do you change the banner colors or add a new gradient theme?
// HOW TO CHANGE: Add or edit gradient strings inside this GRADIENTS array.
const GRADIENTS = [
  'linear-gradient(135deg,rgba(233,30,140,.7),rgba(168,85,247,.6))',
  'linear-gradient(135deg,rgba(59,130,246,.7),rgba(6,182,212,.6))',
  'linear-gradient(135deg,rgba(249,115,22,.7),rgba(239,68,68,.6))',
  'linear-gradient(135deg,rgba(34,197,94,.7),rgba(6,182,212,.6))',
  'linear-gradient(135deg,rgba(139,92,246,.7),rgba(236,72,153,.6))',
];

export default function StaffAssignedEvents() {
  const navigate = useNavigate();

  // Stores logged-in staff member session details (name, email, role, token)
  // FACULTY MAY ASK: How does the component know which staff member is logged in?
  // HOW TO CHANGE: It reads from sessionStorage/localStorage via getSessionUser().
  const [session] = useState(() => getSessionUser());

  // Stores all event assignment records belonging to this staff member
  // FACULTY MAY ASK: Where are the assignments saved?
  // HOW TO CHANGE: Stored in this assignments state array after fetching from /api/staff-assignments.
  const [assignments, setAssignments] = useState([]);

  // Shows loading indicator while waiting for API responses
  // FACULTY MAY ASK: How do you customize the loading state text?
  // HOW TO CHANGE: Look for "loading ? '...' : totalCount" in the StatCards below and replace '...' with your text.
  const [loading, setLoading] = useState(true);

  // Stores any network or server error to display in a red banner
  // FACULTY MAY ASK: How do you change the error banner color from red to orange?
  // HOW TO CHANGE: In the "{error && ...}" JSX block below, replace "var(--red-dim)" with "var(--orange-dim)".
  const [error, setError] = useState(null);

  // Active filter tab: 'all' | 'pending' | 'accepted' | 'rejected'
  // FACULTY MAY ASK: How do you make the page open on the "Pending" tab by default?
  // HOW TO CHANGE: Change initial state from useState('all') to useState('pending').
  const [filter, setFilter] = useState('all');

  // Stores temporary notification message shown in the top toast popup
  // FACULTY MAY ASK: How do you change the toast popup duration?
  // HOW TO CHANGE: In handleRespond(), change 3000 to 5000 in setTimeout(() => setToastMessage(null), 3000).
  const [toastMessage, setToastMessage] = useState(null);

  // Fetches assignments from backend, identifies staff member, and filters matching rows
  // FACULTY MAY ASK: How does staff identity matching work?
  // HOW TO CHANGE: It matches matchedStaffId with a.staffId, then falls back to case-insensitive name matching.
  const loadAssignments = async () => {
    try {
      setError(null);
      const [allAssignments, staffList] = await Promise.all([
        fetchStaffAssignments(),
        fetchStaffList().catch(() => []),
      ]);

      const myName = (session.name || '').trim().toLowerCase();
      const myEmail = (session.email || '').toLowerCase();
      let matchedStaffId = session.staffId;

      if (!matchedStaffId && Array.isArray(staffList)) {
        const matched = staffList.find(
          (st) =>
            (st.name && st.name.trim().toLowerCase() === myName) ||
            (st.email && st.email.toLowerCase() === myEmail)
        );
        if (matched) matchedStaffId = matched.id;
      }

      const filteredMine = Array.isArray(allAssignments)
        ? allAssignments.filter((a) => {
            if (matchedStaffId && a.staffId === matchedStaffId) return true;
            if (a.staffName && a.staffName.trim().toLowerCase() === myName) return true;
            return false;
          })
        : [];

      setAssignments(filteredMine);
    } catch (err) {
      setError(err.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  // Runs on mount and polls every 5 seconds to sync with backend changes
  // FACULTY MAY ASK: Why is setInterval used here?
  // HOW TO CHANGE: It auto-refreshes every 5 seconds so when a vendor assigns an event, it appears without page reload.
  useEffect(() => {
    loadAssignments();
    const interval = setInterval(loadAssignments, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handles staff member clicking "Accept" or "Reject" on an assignment card
  // FACULTY MAY ASK: How do you add a confirmation dialog before rejecting an event?
  // HOW TO CHANGE: At the start of handleRespond, add: if (decision === 'rejected' && !window.confirm('Reject this event?')) return;
  const handleRespond = async (id, decision) => {
    try {
      const patch = {
        status: decision,
        respondedAt: new Date().toISOString(),
      };

      // Persist to backend via PATCH /api/staff-assignments/:id
      await updateStaffAssignment(id, patch);

      setToastMessage({
        text: decision === 'accepted' ? '✓ Assignment accepted! Check your Task Board.' : '✕ Assignment rejected.',
        type: decision === 'accepted' ? 'success' : 'warn',
      });

      setTimeout(() => setToastMessage(null), 3000);

      // Optimistically update local state for instant feedback
      setAssignments((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
      );
    } catch (err) {
      alert(`Error updating assignment: ${err.message}`);
    }
  };

  // Metrics calculations for the top 4 stat cards
  // FACULTY MAY ASK: Why does rejected count include both 'rejected' and 'declined'?
  // HOW TO CHANGE: In rejectedCount, both statuses are checked to support legacy and current backend data models.
  const totalCount = assignments.length;
  const pendingCount = assignments.filter((a) => a.status === 'pending').length;
  const acceptedCount = assignments.filter((a) => a.status === 'accepted').length;
  const rejectedCount = assignments.filter((a) => a.status === 'rejected' || a.status === 'declined').length;

  // Filters assignments based on the active tab ('all', 'pending', 'accepted', 'rejected')
  // FACULTY MAY ASK: How do you sort the assignments by event date?
  // HOW TO CHANGE: Inside useMemo, add ".sort((a, b) => (a.eventDate || '').localeCompare(b.eventDate || ''))".
  const filteredAssignments = useMemo(() => {
    if (filter === 'all') return assignments;
    if (filter === 'rejected') {
      return assignments.filter((a) => a.status === 'rejected' || a.status === 'declined');
    }
    return assignments.filter((a) => a.status === filter);
  }, [assignments, filter]);

  return (
    <div className="staff-page-container">
      {/* Toast alert popup */}
      {toastMessage && <Toast message={toastMessage.text} type={toastMessage.type} />}

      {/* SECTION: Page Title & Subtitle */}
      {/* FACULTY MAY ASK: How do you change the page header? */}
      {/* HOW TO CHANGE: Edit text inside page-title and page-sub divs below. */}
      <div className="page-title">Assigned Events</div>
      <div className="page-sub">Events assigned to you by the vendor — accept or reject below</div>

      {/* SECTION: Error Banner (shown only on network failure) */}
      {error && (
        <div style={{ padding: '12px 16px', background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: 'var(--rs)', marginBottom: '16px', fontSize: '13px', color: '#fff' }}>
          {error}
        </div>
      )}

      {/* SECTION: 4 Summary Metric Cards */}
      {/* FACULTY MAY ASK: How do you change the label of the "Rejected" card to "Declined"? */}
      {/* HOW TO CHANGE: In the 4th StatCard below, change label="Rejected" to label="Declined". */}
      <div className="ae-stats">
        <StatCard label="Total Assigned" value={loading ? '...' : totalCount} icon="📋" iconClass="ico-pink" valueClass="c-pink" />
        <StatCard label="Pending" value={loading ? '...' : pendingCount} icon="⏳" iconClass="ico-orange" valueClass="c-orange" />
        <StatCard label="Accepted" value={loading ? '...' : acceptedCount} icon="✓" iconClass="ico-green" valueClass="c-green" />
        <StatCard label="Rejected" value={loading ? '...' : rejectedCount} icon="✕" iconClass="ico-red" valueClass="c-red" />
      </div>

      {/* SECTION: Filter Bar Tabs */}
      {/* FACULTY MAY ASK: How do you add a new filter button for "High Priority"? */}
      {/* HOW TO CHANGE: Add 'high' to the array below and update filteredAssignments to filter by priority === 'High'. */}
      <div className="ae-filter-bar">
        {['all', 'pending', 'accepted', 'rejected'].map((tab) => (
          <button
            key={tab}
            className={`ae-filter-btn ${filter === tab ? 'active' : ''}`}
            onClick={() => setFilter(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* SECTION: Event Cards Grid */}
      <div className="ae-grid">
        {/* Empty state when no assignments match the filter */}
        {/* FACULTY MAY ASK: How do you change the empty state icon from mailbox to a calendar? */}
        {/* HOW TO CHANGE: In ae-empty-icon below, change "📭" to "📅". */}
        {filteredAssignments.length === 0 ? (
          <div className="ae-empty" style={{ gridColumn: '1 / -1' }}>
            <div className="ae-empty-icon">📭</div>
            <div className="ae-empty-title">
              {loading ? 'Loading assignments...' : filter === 'all' ? 'No assignments yet' : `No ${filter} assignments`}
            </div>
            <div style={{ fontSize: '12.5px', marginTop: '4px' }}>
              The vendor will assign you to events from Manage Staff.
            </div>
          </div>
        ) : (
          filteredAssignments.map((a, index) => {
            const grad = GRADIENTS[index % GRADIENTS.length];
            const priority = a.priority || 'Medium';
            const priCls = priority === 'High' ? 'pri-high' : priority === 'Low' ? 'pri-low' : 'pri-medium';

            const status = String(a.status || 'pending').toLowerCase();
            const pillCls = status === 'accepted' ? 'pill-accepted' : status === 'rejected' || status === 'declined' ? 'pill-rejected' : 'pill-pending';
            const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

            const formattedDate = a.eventDate
              ? new Date(a.eventDate + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : '—';

            const assignedDateStr = a.assignedAt ? new Date(a.assignedAt).toLocaleDateString() : 'Recently';

            return (
              <div key={a.id || index} className="ae-card">
                {/* Event Card Header with Gradient Banner and Title */}
                <div className="ae-card__img" style={{ background: grad }}>
                  <div className="ae-card__img-overlay"></div>
                  <div className="ae-card__badge">
                    <span className={`ae-status-pill ${pillCls}`}>{statusLabel}</span>
                  </div>
                  <div className="ae-card__title">{a.eventName || 'Event'}</div>
                </div>

                {/* Event Card Details Body */}
                <div className="ae-card__body">
                  {/* Meta items: Date, Venue, Guest Count */}
                  {/* FACULTY MAY ASK: How do you hide the Guest Count if it is not provided? */}
                  {/* HOW TO CHANGE: Guest count is already conditionally rendered via "{a.eventPeople && ...}". */}
                  <div className="ae-meta-list">
                    <div className="ae-meta-item">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <path d="M16 2v4M8 2v4M3 10h18" />
                      </svg>
                      {formattedDate}
                    </div>

                    {a.eventVenue && (
                      <div className="ae-meta-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        {a.eventVenue}
                      </div>
                    )}

                    {a.eventPeople && (
                      <div className="ae-meta-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                        </svg>
                        {a.eventPeople} Guests
                      </div>
                    )}
                  </div>

                  {/* Tasks Box: Shows count of sub-tasks and their descriptions */}
                  {/* FACULTY MAY ASK: How do you change the status icon for finished tasks? */}
                  {/* HOW TO CHANGE: In the ternary below, change '✅' to '[Done]' or any other symbol. */}
                  <div className="ae-task-box">
                    <div className="ae-task-label">
                      Assigned Tasks ({(a.tasks || []).length || (a.taskDesc ? 1 : 0)})
                    </div>

                    {Array.isArray(a.tasks) && a.tasks.length > 0 ? (
                      a.tasks.map((task, tIdx) => {
                        const tPriCls = task.priority === 'High' ? 'pri-high' : task.priority === 'Low' ? 'pri-low' : 'pri-medium';
                        const tIcon = task.status === 'done' ? '✅' : task.status === 'progress' ? '🔄' : '⬜';
                        return (
                          <div
                            key={task.id || tIdx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              marginTop: '6px',
                              padding: '6px 8px',
                              background: 'var(--bg3)',
                              borderRadius: '6px',
                              border: '1px solid var(--border2)',
                            }}
                          >
                            <span style={{ fontSize: '12px' }}>{tIcon}</span>
                            <span className="ae-task-text" style={{ flex: 1 }}>{task.desc}</span>
                            <span className={`priority-badge ${tPriCls}`} style={{ fontSize: '9px' }}>
                              {task.priority || 'Medium'}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <span className="ae-task-text">{a.taskDesc || 'General Staff duties'}</span>
                        <span className={`priority-badge ${priCls}`}>{priority}</span>
                      </div>
                    )}

                    <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '6px' }}>
                      Assigned by Vendor · {assignedDateStr}
                    </div>
                  </div>

                  {/* Actions Section: Accept / Reject when pending; View Tasks / Message when accepted */}
                  {/* FACULTY MAY ASK: Where does "View Tasks" navigate? */}
                  {/* HOW TO CHANGE: Look for onClick={() => navigate('/staff/task-board')} on the ae-btn--tasks button. */}
                  <div className="ae-actions">
                    {status === 'pending' ? (
                      <>
                        <button
                          className="ae-btn ae-btn--accept"
                          onClick={() => handleRespond(a.id, 'accepted')}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Accept
                        </button>
                        <button
                          className="ae-btn ae-btn--reject"
                          onClick={() => handleRespond(a.id, 'rejected')}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                          Reject
                        </button>
                      </>
                    ) : status === 'accepted' ? (
                      <>
                        <button
                          className="ae-btn ae-btn--tasks"
                          onClick={() => navigate('/staff/task-board')}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <path d="M9 9h6M9 13h4" />
                          </svg>
                          View Tasks
                        </button>
                        <button
                          className="ae-btn ae-btn--msg"
                          onClick={() => navigate('/staff/task-board')}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                          Message
                        </button>
                      </>
                    ) : (
                      <div style={{ fontSize: '12px', color: 'var(--text3)', padding: '6px 0' }}>
                        Assignment declined. No action needed.
                      </div>
                    )}
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

/* ============================================================
   VIVA QUICK NOTES - AssignedEvents.jsx
   ============================================================
   DATA FLOW:
   1. Backend API: GET /api/staff-assignments loads all assignments.
   2. Identity Resolution: Matches current user from session with staff list to filter 'assignments'.
   3. Filtering: useMemo computes 'filteredAssignments' based on active filter ('all', 'pending', etc.).
   4. Accept / Reject: Clicking buttons calls handleRespond() -> sends PATCH /api/staff-assignments/:id
      with { status: 'accepted' | 'rejected', respondedAt: timestamp }.
   5. UI Updates: Local state updates optimistically and a toast confirmation is shown.

   TOP 5 QUESTIONS FACULTY IS MOST LIKELY TO ASK:
   1. "Change default filter to show 'Pending' events first":
      -> Edit line with 'const [filter, setFilter] = useState('all');' and change 'all' to 'pending'.
   2. "Where does clicking 'Accept' send data to the backend?":
      -> In handleRespond(): it calls updateStaffAssignment(id, { status: 'accepted', respondedAt: ... })
         which executes a PATCH to /api/staff-assignments/:id.
   3. "How do you add a confirmation alert before rejecting an event?":
      -> Inside handleRespond(): add "if (decision === 'rejected' && !window.confirm('Reject?')) return;".
   4. "How do you sort cards so the nearest event date appears first?":
      -> Inside filteredAssignments useMemo, add: .sort((a,b) => (a.eventDate||'').localeCompare(b.eventDate||'')).
   5. "Where does the 'View Tasks' button navigate to?":
      -> It calls navigate('/staff/task-board') on the ae-btn--tasks button.
   ============================================================ */