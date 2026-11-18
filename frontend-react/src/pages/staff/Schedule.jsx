/**
 * PAGE: Schedule.jsx
 * WHAT IT DOES:
 *   Staff event calendar and schedule viewer. Renders an interactive monthly calendar
 *   grid with month navigation, calculates upcoming event metrics (Total, This Week, Upcoming),
 *   displays daily agendas for clicked dates, and lists accepted upcoming events.
 *
 * APIS USED:
 *   - GET /api/staff-assignments  -> loads all assignments to extract accepted event dates
 *   - GET /api/staff              -> matches staff profile and identity
 */

import React, { useState, useEffect, useMemo } from 'react';
import '../../styles/staff.css';
import StatCard from './components/StatCard';
import { getSessionUser, fetchStaffAssignments, fetchStaffList, fetchEvents } from '../../services/staffApi';

// Month names list used for calendar header and selected date label
// FACULTY MAY ASK: How do you show 3-letter month abbreviations instead of full names?
// HOW TO CHANGE: Replace the month strings in MONTH_NAMES with ['Jan', 'Feb', 'Mar', ...].
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Day names list used to format the selected date header
// FACULTY MAY ASK: How do you change the day name format?
// HOW TO CHANGE: Edit the strings in DAY_NAMES or format via new Date().toLocaleDateString().
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function StaffSchedule() {
  // Stores current staff session info (name, email, role, token)
  // FACULTY MAY ASK: Where does staff profile data come from?
  // HOW TO CHANGE: From browser session storage via getSessionUser() in staffApi.js.
  const [session] = useState(() => getSessionUser());

  // Stores this staff member's accepted event assignments
  // FACULTY MAY ASK: How do you show pending events in the calendar too?
  // HOW TO CHANGE: In loadData(), change "a.status === 'accepted'" to allow 'pending' as well.
  const [assignments, setAssignments] = useState([]);

  // Shows loading indicator while assignments are being fetched from the server
  // FACULTY MAY ASK: How do you customize the loading text?
  // HOW TO CHANGE: Search for "loading ? '...' :" in StatCard calls below.
  const [loading, setLoading] = useState(true);

  // Stores error message if API fails
  // FACULTY MAY ASK: How do you style the error message differently?
  // HOW TO CHANGE: In the "{error && ...}" JSX block below, edit the inline style or class.
  const [error, setError] = useState(null);

  // Active view toggle: 'Day' | 'Week' | 'Month'. It decides which days the
  // calendar shows (one day, the week of the selected day, or the whole month)
  // and how far the ‹ › arrows move.
  // FACULTY MAY ASK: How do you make "Day" view active by default?
  // HOW TO CHANGE: Change initial state useState('Month') to useState('Day').
  const [viewMode, setViewMode] = useState('Month');

  // Currently viewed calendar year
  // Starts on today's year (it used to be fixed to 2026)
  const [curYear, setCurYear] = useState(() => new Date().getFullYear());

  // Currently viewed calendar month (0-indexed: 0 = Jan, 2 = March)
  // Starts on today's month (it used to be fixed to March)
  const [curMonth, setCurMonth] = useState(() => new Date().getMonth());

  // Day number currently selected in the calendar grid
  // Starts on today
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDate());

  // Events by id, for the real start/end time and status of each assignment
  const [eventsById, setEventsById] = useState({});

  // Fetches assignments from backend and filters only accepted ones for this staff member
  // FACULTY MAY ASK: How often does the schedule refresh from the server?
  // HOW TO CHANGE: Polling runs every 5 seconds via setInterval(loadData, 5000); adjust 5000 to change it.
  useEffect(() => {
    async function loadData() {
      try {
        setError(null);
        const [allAssignments, staffList, events] = await Promise.all([
          fetchStaffAssignments(),
          fetchStaffList().catch(() => []),
          fetchEvents().catch(() => []),
        ]);
        const byId = {};
        (Array.isArray(events) ? events : []).forEach((e) => { byId[e.id] = e; });
        setEventsById(byId);

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

        const mine = Array.isArray(allAssignments)
          ? allAssignments.filter((a) => {
              const isMe =
                (matchedStaffId && a.staffId === matchedStaffId) ||
                (a.staffName && a.staffName.trim().toLowerCase() === myName);
              return isMe && ['accepted', 'assigned', 'confirmed', 'in_progress'].includes(String(a.status || '').toLowerCase());
            })
          : [];

        setAssignments(mine);
      } catch (err) {
        setError(err.message || 'Failed to load schedule');
      } finally {
        setLoading(false);
      }
    }

    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [session]);

  // Handles clicking the previous (<) or next (>) month arrow buttons
  // FACULTY MAY ASK: How does month navigation wrap from December into January?
  // HOW TO CHANGE: If nextMonth > 11, it resets to 0 and increments curYear by 1.
  const handleMonthChange = (delta) => {
    let nextMonth = curMonth + delta;
    let nextYear = curYear;
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    } else if (nextMonth < 0) {
      nextMonth = 11;
      nextYear -= 1;
    }
    setCurMonth(nextMonth);
    setCurYear(nextYear);
  };

  // Moves the selected date by `days` (Week = 7, Day = 1); the month follows
  const shiftSelectedDate = (days) => {
    const next = new Date(curYear, curMonth, selectedDay + days);
    setCurYear(next.getFullYear());
    setCurMonth(next.getMonth());
    setSelectedDay(next.getDate());
  };

  // The ‹ › arrows: a month, a week or a day depending on the view
  const handleStep = (direction) => {
    if (viewMode === 'Month') handleMonthChange(direction);
    else shiftSelectedDate(direction * (viewMode === 'Week' ? 7 : 1));
  };

  // Total count of accepted events on this staff member's schedule
  const totalAcceptedEvents = assignments.length;

  // Events from today onwards
  const todayStr = new Date().toLocaleDateString('en-CA');
  const upcomingCount = assignments.filter((a) => a.eventDate && a.eventDate >= todayStr).length;

  // "6:00 PM – 10:00 PM" from the real event, or "" when it has no times
  const timeRangeOf = (a) => {
    const ev = eventsById[a.eventId];
    if (!ev?.time) return '';
    return ev.endTime ? `${ev.time} – ${ev.endTime}` : ev.time;
  };

  // Calculates how many events occur within the next 7 days
  // FACULTY MAY ASK: How do you change the "This Week" range to check the next 14 days?
  // HOW TO CHANGE: In thisWeekCount calculation, change "now.getDate() + 7" to "now.getDate() + 14".
  const thisWeekCount = useMemo(() => {
    const now = new Date();
    const weekLater = new Date();
    weekLater.setDate(now.getDate() + 7);

    return assignments.filter((a) => {
      if (!a.eventDate) return false;
      const d = new Date(a.eventDate);
      return d >= now && d <= weekLater;
    }).length;
  }, [assignments]);

  // Builds the 7-column calendar matrix with previous month fillers, current days, and next month fillers
  // FACULTY MAY ASK: How does the calendar know which days have events?
  // HOW TO CHANGE: Point to "const hasEvent = assignments.some(...)": it matches cell dateStr with eventDate.
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(curYear, curMonth, 1).getDay();
    const daysInCurrentMonth = new Date(curYear, curMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(curYear, curMonth, 0).getDate();

    const cells = [];

    // Previous month trailing days to align the starting weekday
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({
        dayNumber: daysInPrevMonth - firstDayIndex + 1 + i,
        isOther: true,
      });
    }

    // Current month days
    const today = new Date();
    const isCurrentMonthThisMonth =
      today.getFullYear() === curYear && today.getMonth() === curMonth;

    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateStr = `${curYear}-${String(curMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const hasEvent = assignments.some(
        (a) => a.eventDate && a.eventDate.startsWith(dateStr)
      );

      cells.push({
        dayNumber: d,
        isOther: false,
        isToday: isCurrentMonthThisMonth && today.getDate() === d,
        isSelected: selectedDay === d,
        hasEvent,
      });
    }

    // Next month leading days to complete the 7-column grid rows
    const totalFilled = firstDayIndex + daysInCurrentMonth;
    const remaining = totalFilled % 7 === 0 ? 0 : 7 - (totalFilled % 7);
    for (let i = 1; i <= remaining; i++) {
      cells.push({
        dayNumber: i,
        isOther: true,
      });
    }

    return cells;
  }, [curYear, curMonth, selectedDay, assignments]);

  // The cells the current view shows: whole month, the selected day's week row, or just that day
  const visibleDays = useMemo(() => {
    if (viewMode === 'Month') return calendarDays;
    const index = calendarDays.findIndex((c) => !c.isOther && c.dayNumber === selectedDay);
    if (viewMode === 'Day') return index >= 0 ? [calendarDays[index]] : [];
    const rowStart = Math.floor(index / 7) * 7;
    return calendarDays.slice(rowStart, rowStart + 7);
  }, [calendarDays, viewMode, selectedDay]);

  // Formatted date string for the selected day header (e.g. "Monday, March 30, 2026")
  const selectedDateObj = new Date(curYear, curMonth, selectedDay);
  const selectedDateLabel = `${DAY_NAMES[selectedDateObj.getDay()]}, ${MONTH_NAMES[curMonth]} ${selectedDay}, ${curYear}`;

  // Filter assignments matching the specific selected calendar date
  const selectedDayDateStr = `${curYear}-${String(curMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
  const dayEvents = assignments.filter(
    (a) => a.eventDate && a.eventDate.startsWith(selectedDayDateStr)
  );

  return (
    <div className="staff-page-container">
      {/* SECTION: Topbar with title and view mode buttons */}
      {/* FACULTY MAY ASK: How do you add a 4th view mode like "Agenda"? */}
      {/* HOW TO CHANGE: Add 'Agenda' to the ['Day', 'Week', 'Month'] array below. */}
      <div className="sch-topbar">
        <div>
          <div className="page-title">My Schedule</div>
          <div style={{ fontSize: '12.5px', color: 'var(--text2)', marginTop: '2px' }}>
            View and manage your upcoming events
          </div>
        </div>

        <div className="sch-view-btns">
          {['Day', 'Week', 'Month'].map((mode) => (
            <button
              key={mode}
              className={`sch-view-btn ${viewMode === mode ? 'active' : ''}`}
              onClick={() => setViewMode(mode)}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION: Error Banner (shown if API fails) */}
      {error && (
        <div style={{ padding: '12px 16px', background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: 'var(--rs)', marginBottom: '16px', fontSize: '13px', color: '#fff' }}>
          {error}
        </div>
      )}

      {/* SECTION: 3 Schedule Summary Stat Cards */}
      {/* FACULTY MAY ASK: How do you change the icon of the "This Week" card? */}
      {/* HOW TO CHANGE: In the second StatCard below, replace the SVG icon with an emoji or different icon. */}
      <div className="sch-stats">
        <StatCard
          label="Total Events"
          value={loading ? '...' : totalAcceptedEvents}
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          }
          iconClass="ico-pink"
        />
        <StatCard
          label="This Week"
          value={loading ? '...' : thisWeekCount}
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          }
          iconClass="ico-cyan"
        />
        <StatCard
          label="Upcoming"
          value={loading ? '...' : upcomingCount}
          icon="🕐"
          iconClass="ico-green"
          valueClass="c-green"
        />
      </div>

      {/* SECTION: Main Schedule Grid (Calendar Card + Right Side Panel) */}
      <div className="sch-grid">
        {/* Calendar Card */}
        {/* FACULTY MAY ASK: How do you highlight the current day in pink on the calendar? */}
        {/* HOW TO CHANGE: In cal-day className below, the "c.isToday ? 'today' : ''" class adds the pink background via staff.css. */}
        <div className="cal-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--pink)" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            <span style={{ fontSize: '13.5px', fontWeight: 600 }}>Calendar</span>
          </div>

          {/* Month navigation header */}
          <div className="cal-head">
            <button className="cal-nav" onClick={() => handleStep(-1)} title={`Previous ${viewMode.toLowerCase()}`}>‹</button>
            <span className="cal-month">
              {viewMode === 'Day' ? selectedDateLabel : viewMode === 'Week' ? `Week of ${MONTH_NAMES[curMonth]} ${selectedDay}, ${curYear}` : `${MONTH_NAMES[curMonth]} ${curYear}`}
            </span>
            <button className="cal-nav" onClick={() => handleStep(1)} title={`Next ${viewMode.toLowerCase()}`}>›</button>
          </div>

          {/* 7-Day Header */}
          <div className="cal-days-header">
            <div className="cal-day-name">Su</div>
            <div className="cal-day-name">Mo</div>
            <div className="cal-day-name">Tu</div>
            <div className="cal-day-name">We</div>
            <div className="cal-day-name">Th</div>
            <div className="cal-day-name">Fr</div>
            <div className="cal-day-name">Sa</div>
          </div>

          {/* Days Grid */}
          <div className="cal-grid" data-view={viewMode}>
            {visibleDays.map((c, i) => (
              <div
                key={i}
                className={`cal-day ${c.isOther ? 'other' : ''} ${c.isToday ? 'today' : ''} ${c.isSelected ? 'selected' : ''} ${c.hasEvent ? 'has-event' : ''}`}
                onClick={() => {
                  if (!c.isOther) setSelectedDay(c.dayNumber);
                }}
              >
                {c.dayNumber}
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel: Selected Date Agenda and Upcoming Events */}
        <div className="sch-right">
          {/* Selected Date Agenda Card */}
          {/* FACULTY MAY ASK: Where do the working hours shown for an event come from? */}
          {/* HOW TO CHANGE: timeRangeOf(a) reads the real event's time and endTime (it used to be fixed text). */}
          <div className="card">
            <div className="card-head">
              <div className="card-title">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--pink)" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
                <span>{selectedDateLabel}</span>
              </div>
            </div>

            <div>
              {dayEvents.length > 0 ? (
                dayEvents.map((a, idx) => (
                  <div key={a.id || idx} className="sch-event-item" style={{ border: 'none', background: 'rgba(233, 30, 140, 0.05)', marginBottom: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <div className="sch-event-name">{a.eventName}</div>
                      <div className="sch-event-role">{a.taskDesc || a.role || 'Event Duties'}</div>
                      {timeRangeOf(a) && (
                        <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>
                          {timeRangeOf(a)}
                        </div>
                      )}
                    </div>
                    <span className="badge badge-pink">{eventsById[a.eventId]?.status || a.status}</span>
                  </div>
                ))
              ) : (
                <div className="sch-empty">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                  <p>No events scheduled for this date</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Events Card */}
          {/* FACULTY MAY ASK: How do you show venue details as "TBD" when no venue is specified? */}
          {/* HOW TO CHANGE: Look for "a.eventVenue || 'No venue specified'" below; change 'No venue specified' to 'TBD'. */}
          <div className="card">
            <div className="card-head">
              <div className="card-title">
                <span className="live-dot" style={{ marginRight: '4px' }}></span>
                Upcoming Events
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {assignments.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text3)', fontSize: '12.5px' }}>
                  {loading ? 'Loading upcoming events...' : 'No accepted events in schedule.'}
                </div>
              ) : (
                assignments.map((a, idx) => (
                  <div key={a.id || idx} className="sch-event-item">
                    <div style={{ flex: 1 }}>
                      <div className="sch-event-name">{a.eventName}</div>
                      <div className="sch-event-role">{a.staffRole || a.role || 'Staff Member'}</div>
                      <div className="sch-event-metas">
                        <div className="sch-event-meta">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          {a.eventDate || 'Date TBD'}
                        </div>
                        <div className="sch-event-meta">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          {a.eventVenue || 'No venue specified'}
                        </div>
                      </div>
                    </div>
                    <span className="badge badge-pink" style={{ flexShrink: 0 }}>{a.status}</span>
                    <span className="sch-event-arrow">›</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   VIVA QUICK NOTES - Schedule.jsx
   ============================================================
   DATA FLOW:
   1. Backend API: GET /api/staff-assignments & GET /api/staff load data.
   2. Identity Resolution: Matches current user from session with staff list to filter 'assignments' (accepted only).
   3. Calendar Calculation: 'calendarDays' useMemo builds previous month fillers, current days, and indicators.
   4. Date Selection: Clicking any date in the calendar sets 'selectedDay' state.
   5. Day Agenda: Filters assignments matching 'selectedDayDateStr' and renders them in the top right card.

   TOP 5 QUESTIONS FACULTY IS MOST LIKELY TO ASK:
   1. "How do you navigate months in the calendar?":
      -> Look at handleMonthChange(delta): it increments or decrements curMonth, wrapping around 0 and 11.
   2b. Day / Week / Month really change the calendar: visibleDays keeps the whole
       month, the selected day's week row, or only that day; ‹ › move by a month,
       a week or a day (handleStep).
   2. "How do you set 'Day' view as the default?":
      -> Edit line with 'const [viewMode, setViewMode] = useState('Month');' and change to 'Day'.
   3. "How does the calendar know which days have an event marker?":
      -> Point to 'hasEvent' inside calendarDays useMemo: it checks if any assignment starts with that cell's dateStr.
   4. "How do you change the 'This Week' range from 7 to 14 days?":
      -> In thisWeekCount useMemo, change 'now.getDate() + 7' to 'now.getDate() + 14'.
   5. "Where are the events in the 'Upcoming Events' list loaded from?":
      -> Point to assignments.map() in the bottom-right card JSX; it loops over all accepted assignments.
   ============================================================ */