import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import VendorTopBar from '../../components/vendor/VendorTopBar';
import MonitoringEventCards from '../../components/vendor/MonitoringEventCards';
import MonitoringStatsCard from '../../components/vendor/MonitoringStatsCard';
import MonitoringQuickActions from '../../components/vendor/MonitoringQuickActions';
import MonitoringTimeline from '../../components/vendor/MonitoringTimeline';
import MonitoringStaffRequests from '../../components/vendor/MonitoringStaffRequests';
import MonitoringStaffProgress from '../../components/vendor/MonitoringStaffProgress';
import MonitoringRisksAndContingency from '../../components/vendor/MonitoringRisksAndContingency';
import MonitoringAlertsFeed from '../../components/vendor/MonitoringAlertsFeed';

import { useNavigate } from 'react-router-dom';
import {
  getContingencyPlans,
  getMonitorProgress,
  getMyEvents,
  getMyIssues,
  getStaffAssignments,
  patchIssue,
  setContingencyPlans,
  setMonitorProgress,
  updateEventStatus,
} from '../../services';
import { sendMessage } from '../../services/messageService';

const REFRESH_MS = 5000;
const PHASES = [
  { key: 'setup', title: 'Setup' },
  { key: 'registration', title: 'Guest Registration' },
  { key: 'event', title: 'Event in Progress' },
  { key: 'breakdown', title: 'Breakdown' },
];
const CLOSED_ASSIGNMENTS = ['rejected', 'declined'];
const lower = (value) => String(value || '').toLowerCase();
const clock = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// "2h 15m" since the event went live
function elapsedSince(iso) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export default function Monitoring() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [staffAssignments, setStaffAssignments] = useState([]);
  const [issues, setIssues] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [plansMap, setPlansMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [sessionAlerts, setSessionAlerts] = useState([]);

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateBulletinText, setUpdateBulletinText] = useState('');
  const [isEndEventModalOpen, setIsEndEventModalOpen] = useState(false);

  const addAlert = useCallback((type, text, source) => {
    setSessionAlerts((prev) => [{ id: `al_${Date.now()}`, type, text, time: 'Just now', source }, ...prev]);
  }, []);

  // Keeps refreshing, so events that start or end on schedule update by themselves
  const loadData = useCallback(async () => {
    try {
      const [evs, assigns, iss, progress, plans] = await Promise.all([
        getMyEvents(),
        getStaffAssignments(),
        getMyIssues(),
        getMonitorProgress(),
        getContingencyPlans(),
      ]);
      const activeEvents = evs.filter((e) => ['live', 'confirmed', 'approved'].includes(lower(e.status)));
      setEvents(activeEvents);
      setStaffAssignments(assigns || []);
      setIssues(iss || []);
      setProgressMap(progress || {});
      setPlansMap(plans && !Array.isArray(plans) ? plans : {});
      setSelectedEventId((current) => {
        if (activeEvents.some((e) => e.id === current)) return current;
        return (activeEvents.find((e) => lower(e.status) === 'live') || activeEvents[0])?.id || null;
      });
    } catch (err) {
      console.error('Failed to load live monitoring data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, REFRESH_MS);
    return () => clearInterval(timer);
  }, [loadData]);

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId) || null,
    [events, selectedEventId]
  );
  const isLive = lower(selectedEvent?.status) === 'live';

  // The event's four phases, as saved. The client sees the same progress.
  const currentMilestones = useMemo(() => {
    if (!selectedEvent) return [];
    const saved = progressMap[selectedEvent.id] || {};
    const firstOpen = PHASES.findIndex((p) => Number(saved[p.key] || 0) < 100);
    return PHASES.map((phase, index) => ({
      id: phase.key,
      title: phase.title,
      time: phase.key === 'event' ? [selectedEvent.time, selectedEvent.endTime].filter(Boolean).join(' – ') : '',
      status: firstOpen === -1 || index < firstOpen ? 'done' : index === firstOpen ? 'current' : 'pending',
    }));
  }, [progressMap, selectedEvent]);

  const progressPercent = useMemo(() => {
    if (!selectedEvent) return 0;
    const saved = progressMap[selectedEvent.id] || {};
    return Math.round(PHASES.reduce((sum, p) => sum + Number(saved[p.key] || 0), 0) / PHASES.length);
  }, [progressMap, selectedEvent]);

  const team = useMemo(
    () =>
      staffAssignments.filter(
        (a) => a.eventId === selectedEvent?.id && !CLOSED_ASSIGNMENTS.includes(lower(a.status))
      ),
    [selectedEvent, staffAssignments]
  );
  const totalStaffCount = team.length;
  const activeStaffCount = team.filter((a) => ['on_site', 'working', 'on_break'].includes(a.workStatus)).length;

  const eventIssues = useMemo(
    () => issues.filter((i) => selectedEvent && (i.eventId === selectedEvent.id || i.event === selectedEvent.id)),
    [issues, selectedEvent]
  );
  const isStaffRequest = (i) =>
    i.type === 'staff_request' || i.category === 'Staff Request' || i.title?.startsWith('Dispatch Request');

  const eventRisks = useMemo(
    () => eventIssues.filter((i) => !isStaffRequest(i) && !['resolved', 'closed'].includes(lower(i.status))),
    [eventIssues]
  );

  const staffRequests = useMemo(
    () =>
      eventIssues
        .filter((i) => isStaffRequest(i) && ['open', 'pending'].includes(lower(i.status)))
        .map((i) => ({
          id: i.id,
          staffName: i.reporter || 'Staff Member',
          role: i.reporterRole || 'Staff',
          requestText: i.desc || i.description || i.title,
          time: i.createdAt ? clock(i.createdAt) : '',
        })),
    [eventIssues]
  );

  const eventPlans = useMemo(
    () => (selectedEvent ? plansMap[selectedEvent.id] || plansMap._default || [] : []),
    [plansMap, selectedEvent]
  );
  const contingencies = useMemo(
    () =>
      eventPlans.map((p) => ({
        id: p.id,
        name: p.problem,
        desc: p.solution,
        status: p.status === 'triggered' ? 'activated' : 'ready',
      })),
    [eventPlans]
  );

  const alertsFeed = useMemo(
    () => [
      ...sessionAlerts,
      ...team
        .filter((a) => a.progressUpdatedAt)
        .sort((a, b) => new Date(b.progressUpdatedAt) - new Date(a.progressUpdatedAt))
        .map((a) => ({
          id: `progress_${a.id}_${a.progressUpdatedAt}`,
          type: a.workStatus === 'finished' ? 'success' : 'info',
          text: `${a.staffName}: ${a.workStatus.replace('_', ' ')}${a.progressNote ? ` — ${a.progressNote}` : ''}`,
          time: clock(a.progressUpdatedAt),
          source: a.role || 'Staff',
        })),
      ...eventIssues.map((i) => ({
        id: `iss_${i.id}`,
        type: lower(i.status) === 'resolved' ? 'success' : 'warning',
        text: i.title,
        time: i.createdAt ? clock(i.createdAt) : '',
        source: i.reporter || 'Issue',
      })),
    ],
    [sessionAlerts, eventIssues, team]
  );

  const handleAdvanceMilestone = useCallback(async () => {
    const current = currentMilestones.find((m) => m.status === 'current');
    if (!selectedEvent || !current) return;
    try {
      const latest = await getMonitorProgress();
      const updated = { ...latest, [selectedEvent.id]: { ...latest[selectedEvent.id], [current.id]: 100 } };
      await setMonitorProgress(updated);
      setProgressMap(updated);
      addAlert('info', `${current.title} finished.`, 'Milestones');
    } catch {
      addAlert('warning', 'Could not save this milestone. Please try again.', 'Milestones');
    }
  }, [selectedEvent, currentMilestones, addAlert]);

  const decideRequest = useCallback(
    async (reqId, status) => {
      try {
        await patchIssue(reqId, { status });
        await loadData();
      } catch {
        addAlert('warning', 'Could not update this request. Please try again.', 'Staff Requests');
      }
    },
    [loadData, addAlert]
  );
  const handleApproveStaffRequest = (reqId) => decideRequest(reqId, 'resolved');
  const handleRejectStaffRequest = (reqId) => decideRequest(reqId, 'rejected');

  const handleTriggerContingency = useCallback(
    async (planId) => {
      if (!selectedEvent) return;
      const toggled = eventPlans.map((p) =>
        p.id === planId ? { ...p, status: p.status === 'triggered' ? 'ready' : 'triggered' } : p
      );
      const updated = { ...plansMap, [selectedEvent.id]: toggled };
      try {
        await setContingencyPlans(updated);
        setPlansMap(updated);
      } catch {
        addAlert('warning', 'Could not save this contingency plan.', 'Contingency');
      }
    },
    [selectedEvent, eventPlans, plansMap, addAlert]
  );

  // The bulletin goes to the event's staff conversation, so the team really gets it
  const handleBroadcastBulletin = async (e) => {
    e.preventDefault();
    const text = updateBulletinText.trim();
    if (!text || !selectedEvent) return;
    try {
      await sendMessage({ threadId: `staff-${selectedEvent.id}`, text: `📢 ${text}` });
      addAlert('info', `Bulletin sent: ${text}`, 'Staff Team');
      setUpdateBulletinText('');
      setIsUpdateModalOpen(false);
    } catch {
      addAlert('warning', 'Could not send this bulletin. Please try again.', 'Staff Team');
    }
  };

  const handleConfirmEndEvent = async () => {
    if (!selectedEvent) return;
    setIsEndEventModalOpen(false);
    try {
      await updateEventStatus(selectedEvent.id, 'completed');
      addAlert('success', `${selectedEvent.name} has ended.`, 'Operations');
      await loadData();
    } catch {
      addAlert('warning', `Could not end ${selectedEvent.name}. Please try again.`, 'Operations');
    }
  };

  const openEventReview = () => {
    if (selectedEvent) navigate(`/vendor/events/${selectedEvent.id}/review`);
  };

  // Reference & dynamic height calculation to sync Alerts Feed with Contingency Protocols
  const contingencyRef = useRef(null);
  const [contingencyHeight, setContingencyHeight] = useState(null);

  useEffect(() => {
    if (!contingencyRef.current) return;

    const measureHeight = () => {
      if (contingencyRef.current) {
        const h = contingencyRef.current.offsetHeight;
        if (h > 0) {
          setContingencyHeight(h);
        }
      }
    };

    measureHeight();
    const ro = new ResizeObserver(measureHeight);
    ro.observe(contingencyRef.current);

    return () => ro.disconnect();
  }, [contingencies]);

  return (
    <div className="vendor-dashboard">
      <VendorTopBar title="Monitor Live Events" />

      <div className="content" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Section Header */}
        <div className="mon-section-header">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span className="mon-section-title">Live Event Monitoring & Field Operations</span>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Real-time milestone progression, workforce check-ins, and emergency contingency execution
            </span>
          </div>

          <span className="live-badge">
            <span className="live-dot" /> {events.filter((e) => String(e.status).toLowerCase() === 'live').length || 1} Event Live
          </span>
        </div>

        {!loading && events.length === 0 && (
          <div className="so-empty">No live or upcoming events to monitor.</div>
        )}

        {/* Event Selector Cards */}
        <MonitoringEventCards
          events={events}
          selectedEventId={selectedEvent?.id}
          onSelectEvent={(ev) => setSelectedEventId(ev.id)}
        />

        {/* Quick Operational Actions Bar */}
        <MonitoringQuickActions
          onUpdateEvent={() => setIsUpdateModalOpen(true)}
          onAllocateResources={openEventReview}
          onAllocateStaff={openEventReview}
          onEndEvent={() => isLive && setIsEndEventModalOpen(true)}
        />

        {/* Event Performance & Health KPI Card */}
        {selectedEvent && (
          <MonitoringStatsCard
            eventName={selectedEvent.name}
            progress={progressPercent}
            duration={isLive && selectedEvent.startedAt ? elapsedSince(selectedEvent.startedAt) : '—'}
            durationSub={isLive ? `Started at ${selectedEvent.time}` : `Starts ${selectedEvent.date} at ${selectedEvent.time}`}
            activeStaffCount={activeStaffCount}
            totalStaffCount={totalStaffCount}
            isLive={isLive}
          />
        )}

        {/* Two-Column Operational Execution Grid */}
        <div className="mon-bottom">
          {/* Left Column: Timeline & Squeezed Alerts Feed */}
          <div className="mon-left">
            <MonitoringTimeline
              milestones={currentMilestones}
              onAdvanceMilestone={handleAdvanceMilestone}
            />

            {/* Live Operational Alerts Feed squeezed inside left column to fill gap, matching Emergency Contingency Protocols height */}
            <MonitoringAlertsFeed
              alerts={alertsFeed}
              isSqueezed
              targetHeight={contingencyHeight}
            />
          </div>

          {/* Right Column: Staff Requests, Risks & Contingency */}
          <div className="mon-right">
            <MonitoringStaffProgress team={team} />

            <MonitoringStaffRequests
              requests={staffRequests}
              onApprove={handleApproveStaffRequest}
              onReject={handleRejectStaffRequest}
            />

            <MonitoringRisksAndContingency
              risks={eventRisks}
              contingencies={contingencies}
              onTriggerContingency={handleTriggerContingency}
              contingencyRef={contingencyRef}
            />
          </div>
        </div>

        {/* ── UPDATE BULLETIN MODAL ── */}
        {isUpdateModalOpen && (
          <div className="modal-overlay open" onClick={() => setIsUpdateModalOpen(false)}>
            <div className="modal" style={{ width: '500px', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 10px', color: 'var(--text-primary)' }}>Broadcast Live Bulletin</h3>
              <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--text-muted)' }}>
                This is sent to the event's staff team in the Coordination Hub.
              </p>

              <form onSubmit={handleBroadcastBulletin}>
                <textarea
                  className="ri-textarea"
                  placeholder="e.g., VIP guests arrived at South Gate. All audio engineers standby for intro fanfare."
                  value={updateBulletinText}
                  onChange={(e) => setUpdateBulletinText(e.target.value)}
                  style={{ minHeight: '100px', marginBottom: '16px' }}
                  required
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="ri-cancel" onClick={() => setIsUpdateModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="ri-submit">
                    Broadcast Bulletin
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── CONCLUDE EVENT CONFIRM MODAL ── */}
        {isEndEventModalOpen && (
          <div className="modal-overlay open" onClick={() => setIsEndEventModalOpen(false)}>
            <div className="modal" style={{ width: '480px', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 10px', color: 'var(--text-primary)' }}>Conclude Live Event?</h3>
              <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Are you sure you want to mark <strong>{selectedEvent?.name}</strong> as completed?
                This will conclude all field tasks, notify staff to begin breakdown, and route final booking invoices to payout settlement.
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="ri-cancel" onClick={() => setIsEndEventModalOpen(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="ri-submit"
                  style={{ background: '#16a34a' }}
                  onClick={handleConfirmEndEvent}
                >
                  Confirm & Conclude Event
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

