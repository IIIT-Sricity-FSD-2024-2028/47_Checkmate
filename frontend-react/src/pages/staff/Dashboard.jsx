/**
 * PAGE: Dashboard.jsx
 * WHAT IT DOES:
 *   Main landing dashboard for the staff role in EventPro. It provides a real-time
 *   operational overview: live clock, 4 stat summary cards, upcoming event schedule preview,
 *   live operational feed ticker, performance snapshot with progress bars, quick action
 *   navigation buttons, and a task count summary.
 *
 * APIS USED:
 *   - GET /api/staff-assignments  -> fetches event assignments for schedule and task counts
 *   - GET /api/staff              -> matches the logged-in staff profile
 *   - GET /api/issues             -> fetches pending issues for attention count
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './staff.css';
import StatCard from './components/StatCard';
import Toast from './components/Toast';
import { getSessionUser, fetchStaffAssignments, fetchStaffList, fetchIssues } from './staffApi';

export default function StaffDashboard() {
  const navigate = useNavigate();

  // Stores logged-in staff member session details (name, email, role, token)
  // FACULTY MAY ASK: How do you display the staff member's full name in the greeting instead of just the first name?
  // HOW TO CHANGE: Look for "const firstName = session.name ? session.name.split(' ')[0] : 'Mike';" and change it to "const firstName = session.name || 'Mike Staff';".
  const [session] = useState(() => getSessionUser());

  // Stores all event assignments belonging to this staff member
  // FACULTY MAY ASK: Where does the dashboard get the list of active assignments?
  // HOW TO CHANGE: It fetches from /api/staff-assignments inside loadData() and stores them in this assignments state.
  const [assignments, setAssignments] = useState([]);

  // Stores open issues reported or relevant to this staff member
  // FACULTY MAY ASK: How do you show all system issues instead of just issues reported by this staff member?
  // HOW TO CHANGE: In loadData(), change the myIssues filter to "const myIssues = issuesData;" without filtering by reporter.
  const [issues, setIssues] = useState([]);

  // Controls the loading spinner/placeholder while fetching data from backend
  // FACULTY MAY ASK: How do you change the loading placeholder text across stat cards?
  // HOW TO CHANGE: In the StatCard props below, change '...' to 'Loading...' for the value prop when loading is true.
  const [loading, setLoading] = useState(true);

  // Stores network error message to display in an alert banner if API is unreachable
  // FACULTY MAY ASK: How do you customize the error banner style or message?
  // HOW TO CHANGE: Search for "{error && ...}" in the JSX below to change the message or CSS.
  const [error, setError] = useState(null);

  // Live clock string formatted as HH:MM:SS
  // FACULTY MAY ASK: How do you switch the clock display to 12-hour AM/PM format instead of 24-hour format?
  // HOW TO CHANGE: In updateClock(), change "hour12: false" to "hour12: true".
  const [currentTime, setCurrentTime] = useState('');

  // Live date string formatted as Day, Month Date (e.g., Monday, March 30)
  // FACULTY MAY ASK: How do you include the year in the topbar date display?
  // HOW TO CHANGE: In updateClock(), add "${now.getFullYear()}" to the setCurrentDate template string.
  const [currentDate, setCurrentDate] = useState('');

  // Toast message shown at the top of the dashboard when new assignments are pending
  // FACULTY MAY ASK: How do you turn off the automatic new assignment toast alert?
  // HOW TO CHANGE: In loadData(), comment out the "setToastMessage(...)" call.
  const [toastMessage, setToastMessage] = useState(null);

  // Stores the feed of live operational updates shown in the middle card
  // FACULTY MAY ASK: How do you add an extra default item to the real-time updates feed?
  // HOW TO CHANGE: Add a 5th object with { id: 5, text: '...', src: '...', time: '...', color: '...', bg: '...', icon: '...' } in useState below.
  const [realtimeUpdates, setRealtimeUpdates] = useState([
    { id: 1, text: 'New task assigned:', src: 'Admin', time: '2 min ago', color: 'c-pink', bg: 'ico-pink', icon: '🔔' },
    { id: 2, text: 'Message from Vendor:', src: 'Vendor', time: '5 min ago', color: 'c-purple', bg: 'ico-purple', icon: '💬' },
    { id: 3, text: 'Event starts in 30 minutes', src: 'System', time: '10 min ago', color: 'c-cyan', bg: 'ico-cyan', icon: '📋' },
    { id: 4, text: 'Resource updated: Sound', src: 'Vendor', time: '15 min ago', color: 'c-green', bg: 'ico-green', icon: '⚡' },
  ]);

  // Runs once on mount to tick the live clock and date every 1 second
  // FACULTY MAY ASK: Why does this useEffect have a cleanup function?
  // HOW TO CHANGE: clearInterval(timer) stops the timer when navigating away from Dashboard to prevent memory leaks.
  useEffect(() => {
    function updateClock() {
      const now = new Date();
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      setCurrentDate(`${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`);
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    }

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetches assignments, staff list, and issues from backend APIs with 5s background polling
  // FACULTY MAY ASK: Why is Promise.allSettled used instead of Promise.all?
  // HOW TO CHANGE: Promise.allSettled ensures that if issues fail to load, assignments and staff data still render without breaking.
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [allAssignments, staffList, allIssues] = await Promise.allSettled([
          fetchStaffAssignments(),
          fetchStaffList(),
          fetchIssues(),
        ]);

        if (!isMounted) return;

        const assignmentsData = allAssignments.status === 'fulfilled' ? allAssignments.value : [];
        const staffData = staffList.status === 'fulfilled' ? staffList.value : [];
        const issuesData = allIssues.status === 'fulfilled' ? allIssues.value : [];

        // Match identity of logged-in staff
        const myName = (session.name || '').trim().toLowerCase();
        const myEmail = (session.email || '').toLowerCase();
        let matchedStaffId = session.staffId;

        if (!matchedStaffId && Array.isArray(staffData)) {
          const matched = staffData.find(
            (st) =>
              (st.name && st.name.trim().toLowerCase() === myName) ||
              (st.email && st.email.toLowerCase() === myEmail)
          );
          if (matched) matchedStaffId = matched.id;
        }

        // Filter assignments belonging to this staff member
        const myAssignments = Array.isArray(assignmentsData)
          ? assignmentsData.filter((a) => {
              if (matchedStaffId && a.staffId === matchedStaffId) return true;
              if (a.staffName && a.staffName.trim().toLowerCase() === myName) return true;
              return false;
            })
          : [];

        setAssignments(myAssignments);

        // Filter issues reported by this staff member or general pending
        const myIssues = Array.isArray(issuesData)
          ? issuesData.filter(
              (i) =>
                i.status === 'open' ||
                (i.reporter && i.reporter.toLowerCase() === myName)
            )
          : [];
        setIssues(myIssues);

        // One-time assignment alert if pending tasks exist
        const pending = myAssignments.filter((a) => a.status === 'pending').length;
        if (pending > 0 && !sessionStorage.getItem('notified_new_assignment')) {
          setToastMessage(`You have ${pending} new event assignment(s) waiting!`);
          sessionStorage.setItem('notified_new_assignment', 'true');
          setTimeout(() => setToastMessage(null), 4000);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Error loading dashboard data');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    const pollInterval = setInterval(loadData, 5000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [session]);

  // Simulates incoming real-time activity updates every 12 seconds
  // FACULTY MAY ASK: How do you make new simulated updates arrive faster, e.g. every 5 seconds?
  // HOW TO CHANGE: Change 12000 to 5000 in setInterval(..., 12000) below.
  useEffect(() => {
    const mockUpdates = [
      { text: 'Client accepted proposal', src: 'System', color: 'c-green', bg: 'ico-green', icon: '✓' },
      { text: 'New vendor registered', src: 'Admin', color: 'c-pink', bg: 'ico-pink', icon: '⚡' },
      { text: "Task 'Stage Setup' delayed", src: 'Vendor', color: 'c-orange', bg: 'ico-orange', icon: '⚠' },
    ];
    let updateIdx = 0;

    const interval = setInterval(() => {
      const next = mockUpdates[updateIdx % mockUpdates.length];
      setRealtimeUpdates((prev) => [
        {
          id: Date.now(),
          text: next.text,
          src: next.src,
          time: 'Just now',
          color: next.color,
          bg: next.bg,
          icon: next.icon,
        },
        ...prev.slice(0, 3),
      ]);
      updateIdx++;
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  // Compute metrics for stat cards and summary cards
  // FACULTY MAY ASK: How do you count completed assignments instead of accepted ones for Active Events?
  // HOW TO CHANGE: Change "a.status === 'accepted'" to "a.status === 'completed'" in activeEventsCount below.
  const activeEventsCount = assignments.filter((a) => a.status === 'accepted').length;
  const upcomingAssignmentsCount = assignments.filter((a) => a.status === 'accepted' || a.status === 'assigned').length;
  const pendingAssignmentsCount = assignments.filter((a) => a.status === 'pending').length;

  let totalTasks = 0;
  let inProgressTasksCount = 0;
  let completedTasksCount = 0;

  assignments.forEach((a) => {
    if (Array.isArray(a.tasks)) {
      totalTasks += a.tasks.length;
      inProgressTasksCount += a.tasks.filter((t) => t.status === 'progress').length;
      completedTasksCount += a.tasks.filter((t) => t.status === 'done').length;
    } else if (a.taskDesc) {
      totalTasks += 1;
      if (a.status === 'accepted') inProgressTasksCount += 1;
    }
  });

  const completionRate = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;

  // Filter schedule items for upcoming schedule card (top 4 upcoming events)
  // FACULTY MAY ASK: How do you display 6 upcoming events instead of 4?
  // HOW TO CHANGE: In upcomingSchedule below, change ".slice(0, 4)" to ".slice(0, 6)".
  const upcomingSchedule = assignments
    .filter((a) => String(a.status).toLowerCase() !== 'declined' && String(a.status).toLowerCase() !== 'rejected')
    .sort((a, b) => String(a.eventDate || '').localeCompare(String(b.eventDate || '')))
    .slice(0, 4);

  const firstName = session.name ? session.name.split(' ')[0] : 'Mike';

  return (
    <div className="staff-page-container">
      {/* Toast Notification */}
      {toastMessage && <Toast message={toastMessage} type="warn" />}

      {/* SECTION: Topbar with greeting, live date, and ticking clock */}
      {/* FACULTY MAY ASK: How do you remove the waving hand emoji from the title? */}
      {/* HOW TO CHANGE: Remove "👋" from the <h1> element below. */}
      <div className="topbar">
        <div className="topbar-left">
          <h1>Welcome back, {firstName} 👋</h1>
          <p>Operational Overview</p>
        </div>
        <div className="topbar-right">
          <div className="topbar-date">{currentDate}</div>
          <div className="topbar-clock">{currentTime}</div>
        </div>
      </div>

      {/* SECTION: Error Alert Banner (only shows if fetch fails) */}
      {error && (
        <div style={{ padding: '12px 16px', background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: 'var(--rs)', marginBottom: '16px', fontSize: '13px', color: '#fff' }}>
          {error}
        </div>
      )}

      {/* SECTION: 4 Summary Stat Cards */}
      {/* FACULTY MAY ASK: How do you change the color or icon of the "Pending Issues" card? */}
      {/* HOW TO CHANGE: In the 4th StatCard below, change iconClass="ico-orange" to "ico-red" and valueClass="c-red" to "c-pink". */}
      <div className="stats-grid col4">
        <StatCard
          label="Active Events"
          value={loading ? '...' : activeEventsCount}
          subtext="Currently active"
          icon={<span className="live-dot" />}
          iconClass="ico-pink"
          valueClass="c-pink"
        />
        <StatCard
          label="Upcoming Assignments"
          value={loading ? '...' : upcomingAssignmentsCount}
          subtext="Scheduled soon"
          icon="🕐"
          iconClass="ico-orange"
          valueClass="c-orange"
        />
        <StatCard
          label="Completed Today"
          value={loading ? '...' : completedTasksCount}
          subtext="Tasks finished"
          icon="✓"
          iconClass="ico-green"
          valueClass="c-green"
        />
        <StatCard
          label="Pending Issues"
          value={loading ? '...' : issues.length}
          subtext="Need attention"
          icon="⚠"
          iconClass="ico-orange"
          valueClass="c-red"
        />
      </div>

      {/* SECTION: Middle Grid (Upcoming Schedule + Real-time Updates) */}
      <div className="db-grid">
        {/* Today's Schedule Card */}
        {/* FACULTY MAY ASK: Where does the "View All" link navigate? */}
        {/* HOW TO CHANGE: It routes to "/staff/schedule"; change to "/staff/assigned-events" in the Link to prop. */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">📅 Upcoming Schedule</div>
            <Link to="/staff/schedule" style={{ fontSize: '11.5px', color: 'var(--pink)', fontWeight: 500 }}>
              View All ↗
            </Link>
          </div>

          <div id="schedList">
            {upcomingSchedule.length === 0 ? (
              <div style={{ padding: '18px 2px', color: 'var(--text3)', fontSize: '12.5px' }}>
                {loading ? 'Loading schedule...' : 'No assignments scheduled yet.'}
              </div>
            ) : (
              upcomingSchedule.map((a) => {
                const status = String(a.status || 'pending').toLowerCase();
                const badgeClass = status === 'accepted' ? 'badge-green' : 'badge-pink';
                const label = status.charAt(0).toUpperCase() + status.slice(1);
                const formattedDate = a.eventDate
                  ? new Date(a.eventDate + 'T00:00:00').toLocaleDateString('en-US')
                  : 'Date TBC';

                return (
                  <div key={a.id || a.eventName} className="sch-item">
                    <div className="sch-item-top">
                      <span className="sch-item-name">{a.eventName || 'Event'}</span>
                      <span className={`badge ${badgeClass}`}>{label}</span>
                    </div>
                    <div className="sch-item-meta">
                      <span className="sch-item-meta-i">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                        </svg>
                        {a.role || a.staffRole || 'Staff'}
                      </span>
                      <span className="sch-item-meta-i">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" />
                          <path d="M16 2v4M8 2v4M3 10h18" />
                        </svg>
                        {formattedDate}
                      </span>
                      <span className="sch-item-meta-i">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        {a.eventVenue || 'Venue TBC'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Real-time Updates Feed Card */}
        {/* FACULTY MAY ASK: How do you change the pill badge color or text for new updates? */}
        {/* HOW TO CHANGE: Look for the <span> inside card-title below and change background, color, or text. */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">
              ⚡ Real-time Updates
              <span style={{ fontSize: '9px', background: 'var(--pink-dim)', color: 'var(--pink)', padding: '2px 6px', borderRadius: '10px', fontWeight: 700, marginLeft: '4px' }}>
                {realtimeUpdates.length} new
              </span>
            </div>
          </div>
          <div className="rt-list">
            {realtimeUpdates.map((item) => (
              <div key={item.id} className="rt-item">
                <div className={`rt-ico ${item.bg}`}>{item.icon}</div>
                <div className="rt-body">
                  <div className="rt-text">{item.text}</div>
                  <div className="rt-meta">
                    <span className={`rt-src ${item.color}`}>{item.src}</span>
                    <span className="rt-time">• {item.time}</span>
                  </div>
                </div>
                <div className="rt-dot"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION: Bottom Grid (Performance Snapshot + Quick Actions & Task Summary) */}
      <div className="db-bottom">
        {/* Performance Snapshot Card */}
        {/* FACULTY MAY ASK: How do you change the Task Completion progress bar color? */}
        {/* HOW TO CHANGE: In the prog-fill div below, change "pf-pink" to "pf-green" or "pf-cyan". */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">⚡ Performance Snapshot</div>
          </div>
          <div className="perf-list">
            <div>
              <div className="perf-row-top">
                <div className="perf-label">🎯 Task Completion Rate</div>
                <span className="perf-val c-pink">
                  {completedTasksCount}/{totalTasks} ({completionRate}%)
                </span>
              </div>
              <div className="prog">
                <div className="prog-fill pf-pink" style={{ width: `${completionRate}%` }}></div>
              </div>
            </div>

            <div>
              <div className="perf-row-top">
                <div className="perf-label">⏱ Avg Response Time</div>
                <span className="perf-val">12 min</span>
              </div>
              <div className="prog">
                <div className="prog-fill pf-green" style={{ width: '60%' }}></div>
              </div>
            </div>

            <div>
              <div className="perf-row-top">
                <div className="perf-label">✅ Issue Resolution Rate</div>
                <span className="perf-val c-green">94%</span>
              </div>
              <div className="prog">
                <div className="prog-fill pf-cyan" style={{ width: '94%' }}></div>
              </div>
            </div>

            <div>
              <div className="perf-row-top">
                <div className="perf-label">👥 Attendance Score</div>
                <span className="perf-val c-green">98%</span>
              </div>
              <div className="prog">
                <div className="prog-fill pf-multi" style={{ width: '98%' }}></div>
              </div>
            </div>
          </div>

          <Link to="/staff/performance" className="btn btn-outline btn-full btn-sm">
            View Detailed Performance ↗
          </Link>
        </div>

        {/* Right column */}
        <div className="db-bottom-right">
          {/* Quick Actions Card */}
          {/* FACULTY MAY ASK: How do you add an extra action button to message the client? */}
          {/* HOW TO CHANGE: Add another <button className="qa-btn" onClick={() => navigate('/staff/task-board')}> inside qa-list below. */}
          <div className="card">
            <div className="card-head">
              <div className="card-title">⚡ Quick Actions</div>
            </div>
            <div className="qa-list">
              <button className="qa-btn" onClick={() => navigate('/staff/task-board')}>
                <div className="qa-ico" style={{ background: 'var(--pink-dim)', color: 'var(--pink)' }}>✓</div>
                Update Task Status
              </button>
              <button className="qa-btn" onClick={() => navigate('/staff/task-board')}>
                <div className="qa-ico" style={{ background: 'var(--bg4)', color: 'var(--text2)' }}>💬</div>
                Message Vendor
              </button>
              <button className="qa-btn" onClick={() => navigate('/staff/report-issue')}>
                <div className="qa-ico" style={{ background: 'var(--orange-dim)', color: 'var(--orange)' }}>⚠</div>
                Report Issue
              </button>
              <button className="qa-btn" onClick={() => navigate('/staff/schedule')}>
                <div className="qa-ico" style={{ background: 'var(--cyan-dim)', color: 'var(--cyan)' }}>📅</div>
                View Schedule
              </button>
            </div>
          </div>

          {/* Task Summary Card */}
          {/* FACULTY MAY ASK: Where are the numbers in the Task Summary card coming from? */}
          {/* HOW TO CHANGE: They come from pendingAssignmentsCount, inProgressTasksCount, and completedTasksCount calculated above. */}
          <div className="card">
            <div className="card-head">
              <div className="card-title">Task Summary</div>
            </div>
            <div className="ts-list">
              <div className="ts-item">
                <div className="ts-ico" style={{ background: 'var(--orange-dim)' }}>🕐</div>
                <div className="ts-info">
                  <div className="ts-name">Pending</div>
                  <div className="ts-sub">Need to accept</div>
                </div>
                <div className="ts-count" style={{ background: 'var(--orange-dim)', color: 'var(--orange)' }}>
                  {pendingAssignmentsCount}
                </div>
              </div>

              <div className="ts-item">
                <div className="ts-ico" style={{ background: 'var(--pink-dim)' }}>⚡</div>
                <div className="ts-info">
                  <div className="ts-name">In Progress</div>
                  <div className="ts-sub">Currently working</div>
                </div>
                <div className="ts-count" style={{ background: 'var(--pink-dim)', color: 'var(--pink)' }}>
                  {inProgressTasksCount}
                </div>
              </div>

              <div className="ts-item">
                <div className="ts-ico" style={{ background: 'var(--green-dim)' }}>✓</div>
                <div className="ts-info">
                  <div className="ts-name">Completed</div>
                  <div className="ts-sub">Finished tasks</div>
                </div>
                <div className="ts-count" style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>
                  {completedTasksCount}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   VIVA QUICK NOTES - Dashboard.jsx
   ============================================================
   DATA FLOW:
   1. Backend API: GET /api/staff-assignments, /api/staff, and /api/issues load data via Promise.allSettled.
   2. Identity Resolution: Matches current user from session with staff list to extract matchedStaffId.
   3. Derived Metrics: Calculates activeEventsCount, totalTasks, inProgressTasksCount, completedTasksCount.
   4. UI State: Topbar live clock updates every 1s, live updates ticker updates every 12s, data polls every 5s.
   5. Interactive Navigation: Buttons use react-router-dom useNavigate() to jump to task-board, schedule, and report-issue.

   TOP 5 QUESTIONS FACULTY IS MOST LIKELY TO ASK:
   1. "Change the clock from 24-hour to 12-hour AM/PM format":
      -> In the first useEffect(), updateClock() function: change "hour12: false" to "hour12: true".
   2. "Change the upcoming schedule card to show 6 events instead of 4":
      -> Look for 'upcomingSchedule' definition, change ".slice(0, 4)" to ".slice(0, 6)".
   3. "How are the numbers in the stat cards calculated?":
      -> Point to lines calculating activeEventsCount, upcomingAssignmentsCount, completedTasksCount, issues.length.
   4. "Add another Quick Action button":
      -> Inside the 'Quick Actions' JSX card, duplicate one <button className="qa-btn"> and customize the icon/text.
   5. "Change the completion rate progress bar color":
      -> Find the 'prog-fill pf-pink' element in JSX; change className 'pf-pink' to 'pf-green' or 'pf-cyan'.
   ============================================================ */