/**
 * ============================================================================
 * CLIENT DASHBOARD (Dashboard.jsx)
 * ============================================================================
 * Role: Client Portal
 * Location: src/pages/client/Dashboard.jsx
 *
 * Purpose:
 *   High-level operational overview for clients:
 *     1. Welcome greeting personalized with client name.
 *     2. 4 Stat KPI cards (Active/Live, Pending Approval, Total Events, Completed).
 *     3. Next Event Progress with 5-stage milestone tracking & full tracking link.
 *     4. Quick Actions (New Event, Pay Invoices, Browse Packages, Message Coordinator).
 *     5. Account Activity feed showing live event lifecycle events.
 * ============================================================================
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Rocket,
  Hourglass,
  CalendarCheck,
  CheckCircle2,
  PlusCircle,
  CreditCard,
  ShoppingBag,
  MessageSquare,
  MapPin,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  AlertCircle,
} from 'lucide-react';

import '../../styles/client.css';
import { getAuthSession, getAuthUser } from '../../services/auth/authStorage';
import { getMyEvents } from '../../services/eventService';
import { getStaffAssignments } from '../../services/staffService';
import { getResourceAllocations } from '../../services/stateService';

export default function ClientDashboard() {
  const navigate = useNavigate();
  const session = getAuthSession();
  const user = getAuthUser() || session?.user || {};
  const clientName = user?.name || session?.name || 'Valued Client';
  const firstName = clientName.split(' ')[0] || 'Client';

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load events
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        setError(null);
        const myEvts = await getMyEvents();
        if (mounted) {
          setEvents(Array.isArray(myEvts) ? myEvts : []);
        }
      } catch (err) {
        if (mounted) {
          console.error('Failed to load client events:', err);
          setError('Unable to fetch live event data.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    const interval = setInterval(loadData, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Compute 4 KPI stats matching legacy client-dashboard.js
  const stats = useMemo(() => {
    const active = events.filter((e) =>
      ['confirmed', 'live', 'approved'].includes(String(e.status || '').toLowerCase())
    ).length;
    const pending = events.filter(
      (e) => String(e.status || '').toLowerCase() === 'pending'
    ).length;
    const total = events.length;
    const completed = events.filter(
      (e) => String(e.status || '').toLowerCase() === 'completed'
    ).length;
    const hasLive = events.some(
      (e) => String(e.status || '').toLowerCase() === 'live'
    );

    return { active, pending, total, completed, hasLive };
  }, [events]);

  // Find next upcoming event (Prioritize Live > Confirmed > Pending, then by date, then by newest ID)
  const nextEvent = useMemo(() => {
    const candidates = events.filter(
      (e) => !['completed', 'rejected'].includes(String(e.status || '').toLowerCase())
    );
    if (candidates.length === 0) return null;

    return [...candidates].sort((a, b) => {
      const ranks = { live: 1, confirmed: 2, approved: 2, pending: 3 };
      const rankA = ranks[String(a.status || '').toLowerCase()] || 4;
      const rankB = ranks[String(b.status || '').toLowerCase()] || 4;
      if (rankA !== rankB) return rankA - rankB;

      const timeA = a.date ? new Date(a.date).getTime() : Infinity;
      const timeB = b.date ? new Date(b.date).getTime() : Infinity;
      if (timeA !== timeB && !isNaN(timeA) && !isNaN(timeB)) return timeA - timeB;

      return String(b.id || '').localeCompare(String(a.id || ''));
    })[0];
  }, [events]);

  // Calculate next event progress percentage & milestones
  const nextEventProgress = useMemo(() => {
    if (!nextEvent) return { progressPct: 0, steps: [] };

    const status = String(nextEvent.status || '').toLowerCase();
    const isApproved = ['confirmed', 'approved', 'live', 'completed'].includes(status);
    const hasResources = Array.isArray(nextEvent.requestedResources) && nextEvent.requestedResources.length > 0;
    const hasStaff = Array.isArray(nextEvent.requestedStaff) && nextEvent.requestedStaff.length > 0;
    const isLiveOrDone = status === 'live' || status === 'completed';

    let stepsComplete = 1; // 1: Submitted always done
    if (isApproved) stepsComplete++;
    if (hasResources) stepsComplete++;
    if (hasStaff) stepsComplete++;
    if (isLiveOrDone) stepsComplete++;

    const progressPct = Math.round((stepsComplete / 5) * 100);

    const steps = [
      { id: 1, label: 'Request Submitted', done: true, current: false },
      { id: 2, label: 'Vendor Feasibility Review', done: isApproved, current: !isApproved && status === 'pending' },
      { id: 3, label: 'Resource Reservation', done: hasResources && isApproved, current: isApproved && !hasResources },
      { id: 4, label: 'Staff Crew Assignment', done: hasStaff && isApproved, current: isApproved && hasResources && !hasStaff },
      { id: 5, label: 'Live Day Execution', done: isLiveOrDone, current: status === 'live' },
    ];

    return { progressPct, steps };
  }, [nextEvent]);

  // Dynamic account activity feed
  const activityFeed = useMemo(() => {
    const list = [];
    events.forEach((ev) => {
      const st = String(ev.status || '').toLowerCase();
      if (st === 'live') {
        list.push({
          id: `act_${ev.id}_live`,
          text: `"${ev.name}" is now executing live at ${ev.venue || 'venue'}.`,
          time: 'Active Now',
          type: 'live',
        });
      } else if (st === 'confirmed' || st === 'approved') {
        list.push({
          id: `act_${ev.id}_conf`,
          text: `Vendor approved "${ev.name}". Logistics and resources locked.`,
          time: 'Recently',
          type: 'approved',
        });
      } else if (st === 'pending') {
        list.push({
          id: `act_${ev.id}_pend`,
          text: `Event request submitted for "${ev.name}". Awaiting coordinator review.`,
          time: 'Pending',
          type: 'pending',
        });
      } else if (st === 'rejected') {
        list.push({
          id: `act_${ev.id}_rej`,
          text: `Proposal for "${ev.name}" was declined. Reason logged.`,
          time: 'Reviewed',
          type: 'rejected',
        });
      } else if (st === 'completed') {
        list.push({
          id: `act_${ev.id}_comp`,
          text: `"${ev.name}" concluded successfully. Final billing archived.`,
          time: 'Concluded',
          type: 'completed',
        });
      }
    });

    if (list.length === 0) {
      list.push({
        id: 'act_init',
        text: 'Account initialized. Ready to create your first event proposal.',
        time: 'Just now',
        type: 'info',
      });
    }

    return list.slice(0, 5);
  }, [events]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBA';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="client-content-wrap">
      {/* Welcome Banner */}
      <div className="welcome-banner mb-6">
        <h2>Welcome back, {firstName} 👋</h2>
        <p>Here's an overview of your upcoming events, booking progress, and active services.</p>
      </div>

      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            padding: '12px 18px',
            color: '#fca5a5',
            marginBottom: '20px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* 4 Stat KPI Cards */}
      <div className="stats-grid mb-6">
        <div className="stat-card">
          <div className="stat-card__top">
            <div className="stat-icon stat-icon--blue">
              <Rocket size={18} />
            </div>
            <span
              className="stat-trend up"
              style={{ color: stats.hasLive ? '#ef4444' : '#22c55e', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              {stats.hasLive ? (
                <>
                  <span className="live-dot-pulse" />
                  Live
                </>
              ) : (
                <>
                  <TrendingUp size={12} />
                  Ready
                </>
              )}
            </span>
          </div>
          <div className="stat-label">Active Events</div>
          <div className="stat-value">{loading ? '...' : stats.active}</div>
          <div className="stat-desc">Events confirmed or currently live</div>
        </div>

        <div className="stat-card">
          <div className="stat-card__top">
            <div className="stat-icon stat-icon--orange">
              <Hourglass size={18} />
            </div>
            <span className="stat-trend" style={{ color: 'var(--orange, #f97316)' }}>
              Awaiting
            </span>
          </div>
          <div className="stat-label">Pending Requests</div>
          <div className="stat-value">{loading ? '...' : stats.pending}</div>
          <div className="stat-desc">Awaiting vendor review & feasibility check</div>
        </div>

        <div className="stat-card">
          <div className="stat-card__top">
            <div className="stat-icon stat-icon--purple">
              <CalendarCheck size={18} />
            </div>
            <span className="stat-trend up" style={{ color: '#22c55e' }}>
              All
            </span>
          </div>
          <div className="stat-label">Total Events</div>
          <div className="stat-value">{loading ? '...' : stats.total}</div>
          <div className="stat-desc">All proposals and booked events</div>
        </div>

        <div className="stat-card">
          <div className="stat-card__top">
            <div className="stat-icon stat-icon--green">
              <CheckCircle2 size={18} />
            </div>
            <span className="stat-trend up" style={{ color: '#22c55e' }}>
              Done
            </span>
          </div>
          <div className="stat-label">Completed Events</div>
          <div className="stat-value">{loading ? '...' : stats.completed}</div>
          <div className="stat-desc">Successfully concluded events</div>
        </div>
      </div>

      {/* Main Grid: Left Column (Next Event Progress) & Right Column (Quick Actions & Activity) */}
      <div className="bottom-grid">
        {/* Left Column: Next Event Progress */}
        <div className="left-col">
          <div className="card">
            <div className="card__header">
              <h3>Next Event Progress</h3>
              {nextEvent ? (
                <Link to={`/client/track/${nextEvent.id}`} className="view-all">
                  Full Tracking →
                </Link>
              ) : (
                <Link to="/client/events" className="view-all">
                  All Events →
                </Link>
              )}
            </div>

            {nextEvent ? (
              <>
                <div
                  style={{
                    marginTop: '10px',
                    marginBottom: '20px',
                    padding: '16px 18px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                  }}
                >
                  <h4
                    style={{
                      fontSize: '16px',
                      marginBottom: '8px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Sparkles size={16} color="var(--pink)" />
                    <span>{nextEvent.name}</span>
                    <span
                      className={`status-badge ${
                        nextEvent.status === 'live'
                          ? 'status-live'
                          : nextEvent.status === 'confirmed'
                          ? 'approved'
                          : 'pending'
                      }`}
                      style={{ fontSize: '11px', padding: '2px 8px', marginLeft: 'auto' }}
                    >
                      {String(nextEvent.status || 'Pending').toUpperCase()}
                    </span>
                  </h4>

                  <p
                    style={{
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <MapPin size={13} /> {nextEvent.venue || 'Venue TBD'}
                    </span>
                    <span>•</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <Calendar size={13} /> {formatDate(nextEvent.date)}
                    </span>
                  </p>

                  {/* Overall Progress Bar */}
                  <div style={{ marginTop: '16px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        marginBottom: '6px',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <span>Execution Milestone Progress</span>
                      <span style={{ color: 'var(--pink)', fontWeight: 600 }}>
                        {nextEventProgress.progressPct}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: '6px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        borderRadius: '3px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${nextEventProgress.progressPct}%`,
                          background: 'linear-gradient(90deg, var(--pink), var(--purple))',
                          borderRadius: '3px',
                          transition: 'width 0.5s ease',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Milestone Checkpoints */}
                <div className="timeline-list">
                  {nextEventProgress.steps.map((st) => (
                    <div
                      key={st.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 0',
                        borderBottom: st.id < 5 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      }}
                    >
                      <div
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          background: st.done
                            ? 'rgba(34, 197, 94, 0.15)'
                            : st.current
                            ? 'rgba(233, 30, 140, 0.15)'
                            : 'rgba(255, 255, 255, 0.05)',
                          color: st.done ? '#22c55e' : st.current ? 'var(--pink)' : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '13px',
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {st.done ? '✓' : st.id}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: st.done || st.current ? 600 : 400,
                            color: st.done
                              ? 'var(--text-primary)'
                              : st.current
                              ? 'var(--pink)'
                              : 'var(--text-muted)',
                          }}
                        >
                          {st.label}
                        </div>
                      </div>

                      <div>
                        {st.done ? (
                          <span style={{ fontSize: '11px', color: '#22c55e', fontWeight: 600 }}>
                            Ready
                          </span>
                        ) : st.current ? (
                          <span style={{ fontSize: '11px', color: 'var(--pink)', fontWeight: 600 }}>
                            In Progress
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Upcoming
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 16px' }}>
                <Calendar size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                  No active events currently scheduled. Plan your next event!
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => navigate('/client/create-event')}
                  style={{ fontSize: '13px' }}
                >
                  <PlusCircle size={14} style={{ marginRight: '6px' }} /> Create Event
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quick Actions & Activity */}
        <div className="right-col">
          {/* Client Quick Actions */}
          <div className="card mb-6">
            <div className="card__header">
              <h3>Quick Actions</h3>
            </div>
            <div className="quick-actions">
              <button
                type="button"
                className="qa-btn"
                onClick={() => navigate('/client/create-event')}
              >
                <div className="qa-icon qa-icon--blue">
                  <PlusCircle size={18} />
                </div>
                <span>New Event</span>
              </button>

              <button
                type="button"
                className="qa-btn"
                onClick={() => navigate('/client/billing')}
              >
                <div className="qa-icon qa-icon--purple">
                  <CreditCard size={18} />
                </div>
                <span>Billing</span>
              </button>

              <button
                type="button"
                className="qa-btn"
                onClick={() => navigate('/client/packages')}
              >
                <div className="qa-icon qa-icon--green">
                  <ShoppingBag size={18} />
                </div>
                <span>Packages</span>
              </button>

              <button
                type="button"
                className="qa-btn"
                onClick={() => navigate('/client/messages')}
              >
                <div className="qa-icon qa-icon--orange">
                  <MessageSquare size={18} />
                </div>
                <span>Messages</span>
              </button>
            </div>
          </div>

          {/* Account Activity */}
          <div className="card">
            <div className="card__header">
              <h3>Account Activity</h3>
            </div>
            <div className="activity-list">
              {activityFeed.map((act) => (
                <div
                  key={act.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 0',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                  }}
                >
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background:
                        act.type === 'live'
                          ? '#ef4444'
                          : act.type === 'approved'
                          ? '#22c55e'
                          : act.type === 'pending'
                          ? 'var(--orange)'
                          : 'var(--cyan)',
                      marginTop: '6px',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                      {act.text}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
                      <Clock size={10} style={{ display: 'inline', marginRight: '4px' }} />
                      {act.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
