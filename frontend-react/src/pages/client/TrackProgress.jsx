/**
 * ============================================================================
 * CLIENT TRACK PROGRESS (TrackProgress.jsx)
 * ============================================================================
 * Role: Client Portal
 * Location: src/pages/client/TrackProgress.jsx
 *
 * Purpose:
 *   Granular lifecycle tracking for a specific event:
 *     - Reads event ID from route params (/client/track/:id)
 *     - Visualizes 5 core milestone stages:
 *         1. Event Submitted
 *         2. Vendor Feasibility Review & Approval
 *         3. Resources & Equipment Reserved
 *         4. On-Site Staff Assigned & Confirmed
 *         5. Event Day Execution & Wrap-Up
 *     - Displays allocated resources, assigned personnel, and vendor contacts
 *     - Action buttons: Back to Events, Message Coordinator
 * ============================================================================
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  MessageSquare,
  Boxes,
  UserCheck,
  Building2,
  AlertTriangle,
  Radio,
} from 'lucide-react';

import '../../styles/client.css';
import { getEventById, getEvents } from '../../services/eventService';
import { getStaffAssignments } from '../../services/staffService';
import { getResourceAllocations } from '../../services/stateService';

export default function ClientTrackProgress() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    let mounted = true;

    async function loadEventData() {
      if (!id) return;
      try {
        setError(null);
        const [ev, allAssigns] = await Promise.all([
          getEventById(id).catch(async () => {
            const all = await getEvents().catch(() => []);
            return all.find((e) => e.id === id) || null;
          }),
          getStaffAssignments().catch(() => []),
        ]);

        if (mounted) {
          if (!ev) {
            setError(`Event "${id}" was not found.`);
          } else {
            setEvent(ev);
            setAssignments(
              Array.isArray(allAssigns)
                ? allAssigns.filter((a) => a.eventId === id)
                : []
            );
          }
        }
      } catch (err) {
        if (mounted) {
          setError(`Failed to load event details: ${err.message}`);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadEventData();
    const interval = setInterval(loadEventData, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [id]);

  // Compute 5-stage milestones
  const milestoneData = useMemo(() => {
    if (!event) return { progressPct: 0, steps: [] };

    const status = String(event.status || '').toLowerCase();
    const isApproved = ['confirmed', 'approved', 'live', 'completed'].includes(status);
    const hasResources =
      (Array.isArray(event.requestedResources) && event.requestedResources.length > 0) ||
      (Array.isArray(event.resources) && event.resources.length > 0);
    const hasStaff = assignments.length > 0 || (Array.isArray(event.requestedStaff) && event.requestedStaff.length > 0);
    const isLiveOrDone = status === 'live' || status === 'completed';

    let count = 1; // 1: Submitted always done
    if (isApproved) count++;
    if (hasResources) count++;
    if (hasStaff) count++;
    if (isLiveOrDone) count++;

    const progressPct = Math.round((count / 5) * 100);

    const steps = [
      {
        id: 1,
        title: 'Event Proposal Submitted',
        desc: 'Request received by EventPro and queued for vendor evaluation.',
        done: true,
        current: false,
        time: event.submittedAt ? new Date(event.submittedAt).toLocaleDateString() : 'Confirmed',
      },
      {
        id: 2,
        title: 'Vendor Feasibility & Conflict Review',
        desc: isApproved
          ? `Approved by ${event.vendor || 'Elite Events Co.'}. Schedule locked.`
          : status === 'rejected'
          ? `Declined: ${event.rejectionReason || 'Vendor conflict'}`
          : 'Coordinator is verifying equipment availability and venue dates.',
        done: isApproved,
        current: status === 'pending',
        time: isApproved ? 'Approved' : status === 'rejected' ? 'Declined' : 'In Review',
      },
      {
        id: 3,
        title: 'Equipment & Staging Allocation',
        desc: hasResources
          ? 'Audiovisual, sound reinforcement, and furniture reserved from warehouse.'
          : 'Pending vendor equipment lock.',
        done: hasResources && isApproved,
        current: isApproved && !hasResources,
        time: hasResources ? 'Reserved' : 'Pending',
      },
      {
        id: 4,
        title: 'Operational Staff Team Assigned',
        desc: hasStaff
          ? `${assignments.length || 'Assigned'} crew members confirmed (Lead Coordinator, AV Specialist, Stage Tech).`
          : 'Coordinators assigning personnel.',
        done: hasStaff && isApproved,
        current: isApproved && hasResources && !hasStaff,
        time: hasStaff ? 'Crew Confirmed' : 'Pending',
      },
      {
        id: 5,
        title: 'Live Event Execution & Wrap-Up',
        desc:
          status === 'live'
            ? 'Event is currently live on-site! Operations active.'
            : status === 'completed'
            ? 'Event concluded successfully with all milestones met.'
            : 'Scheduled for live countdown.',
        done: isLiveOrDone,
        current: status === 'live',
        time: status === 'live' ? 'LIVE NOW' : status === 'completed' ? 'Done' : 'Upcoming',
      },
    ];

    return { progressPct, steps };
  }, [event, assignments]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBA';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="client-content-wrap" style={{ textAlign: 'center', padding: '60px' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading live event tracking...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="client-content-wrap" style={{ maxWidth: '600px', margin: '40px auto' }}>
        <div className="card" style={{ textAlign: 'center', padding: '36px' }}>
          <AlertTriangle size={36} color="#ef4444" style={{ marginBottom: '12px' }} />
          <h3>Event Not Found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
            {error || 'Unable to locate this event.'}
          </p>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/client/events')}>
            <ArrowLeft size={14} style={{ marginRight: '6px' }} /> Back to My Events
          </button>
        </div>
      </div>
    );
  }

  const status = String(event.status || 'pending').toLowerCase();

  return (
    <div className="client-content-wrap">
      {/* Top Navigation */}
      <div style={{ marginBottom: '20px' }}>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => navigate('/client/events')}
          style={{ padding: '6px 12px', fontSize: '13px', marginBottom: '12px' }}
        >
          <ArrowLeft size={14} style={{ marginRight: '6px' }} /> Back to My Events
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {event.name}
              </h2>
              <span
                className={`status-badge ${
                  status === 'live' ? 'status-live' : status === 'confirmed' ? 'approved' : status
                }`}
                style={{ fontSize: '11px', padding: '3px 10px' }}
              >
                {status === 'live' && <span className="live-dot-pulse" />}
                {status.toUpperCase()}
              </span>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '6px 0 0', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <span>ID: <strong style={{ color: 'var(--pink)' }}>{event.id}</strong></span>
              <span>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={13} /> {formatDate(event.date)}
              </span>
              <span>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={13} /> {event.venue || 'Venue TBD'}
              </span>
              <span>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Users size={13} /> {event.people || event.guests || '—'} Guests
              </span>
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/client/messages')}
          >
            <MessageSquare size={14} style={{ marginRight: '6px' }} /> Message Coordinator
          </button>
        </div>
      </div>

      {/* Hero Progress Card */}
      <div className="card mb-6" style={{ background: 'linear-gradient(180deg, rgba(233,30,140,0.06), var(--bg-card))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Overall Execution Progress
            </h3>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Real-time synchronization with vendor dispatch & logistics
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--pink)' }}>
            {milestoneData.progressPct}%
          </div>
        </div>

        <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${milestoneData.progressPct}%`,
              background: 'linear-gradient(90deg, var(--pink), var(--purple))',
              borderRadius: '4px',
              transition: 'width 0.6s ease',
            }}
          />
        </div>
      </div>

      {/* 5-Stage Milestone Timeline */}
      <div className="card mb-6">
        <div className="card__header">
          <h3>Lifecycle Checkpoints</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
          {milestoneData.steps.map((st, idx) => (
            <div
              key={st.id}
              style={{
                display: 'flex',
                gap: '16px',
                position: 'relative',
              }}
            >
              {/* Node Icon */}
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: st.done
                    ? 'rgba(34,197,94,0.15)'
                    : st.current
                    ? 'rgba(233,30,140,0.15)'
                    : 'rgba(255,255,255,0.05)',
                  border: `2px solid ${
                    st.done ? '#22c55e' : st.current ? 'var(--pink)' : 'rgba(255,255,255,0.1)'
                  }`,
                  color: st.done ? '#22c55e' : st.current ? 'var(--pink)' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '13px',
                  flexShrink: 0,
                  zIndex: 2,
                }}
              >
                {st.done ? '✓' : st.id}
              </div>

              {/* Connecting line */}
              {idx < milestoneData.steps.length - 1 && (
                <div
                  style={{
                    position: 'absolute',
                    left: '15px',
                    top: '32px',
                    bottom: '-16px',
                    width: '2px',
                    background: st.done ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.06)',
                    zIndex: 1,
                  }}
                />
              )}

              {/* Step Body */}
              <div
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: st.current
                    ? 'rgba(233,30,140,0.06)'
                    : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${
                    st.current ? 'rgba(233,30,140,0.25)' : 'rgba(255,255,255,0.04)'
                  }`,
                  borderRadius: '10px',
                  marginBottom: '6px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    {st.title}
                  </h4>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: st.done ? '#22c55e' : st.current ? 'var(--pink)' : 'var(--text-muted)',
                    }}
                  >
                    {st.time}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0', lineHeight: 1.4 }}>
                  {st.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: Allocated Resources & Assigned Team */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Allocated Resources */}
        <div className="card">
          <div className="card__header">
            <h3><Boxes size={16} className="text-cyan" style={{ display: 'inline', marginRight: '6px' }} /> Reserved Equipment</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Array.isArray(event.requestedResources) && event.requestedResources.length > 0 ? (
              event.requestedResources.map((r, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {r.resourceName || r.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {r.category || 'Equipment'} • Vendor: {r.vendor || event.vendor || 'Elite Events Co.'}
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--pink)' }}>
                    Qty: {r.quantity || r.qty || 1}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '16px 0' }}>
                Standard venue layout included. No custom add-on equipment logged.
              </div>
            )}
          </div>
        </div>

        {/* Assigned Team */}
        <div className="card">
          <div className="card__header">
            <h3><UserCheck size={16} className="text-pink" style={{ display: 'inline', marginRight: '6px' }} /> Assigned Operations Team</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {assignments.length > 0 ? (
              assignments.map((a, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--purple), var(--pink))',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    {(a.staffName || 'S')
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {a.staffName}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--cyan)' }}>
                      {a.role || 'Event Staff'}
                    </div>
                  </div>
                  <span className="status-badge approved" style={{ fontSize: '10px' }}>
                    Active
                  </span>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '16px 0' }}>
                Vendor is assembling the dedicated staff crew for this event.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
