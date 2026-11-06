import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import VendorTopBar from '../../components/vendor/VendorTopBar';
import MonitoringEventCards from '../../components/vendor/MonitoringEventCards';
import MonitoringStatsCard from '../../components/vendor/MonitoringStatsCard';
import MonitoringQuickActions from '../../components/vendor/MonitoringQuickActions';
import MonitoringTimeline from '../../components/vendor/MonitoringTimeline';
import MonitoringStaffRequests from '../../components/vendor/MonitoringStaffRequests';
import MonitoringRisksAndContingency from '../../components/vendor/MonitoringRisksAndContingency';
import MonitoringAlertsFeed from '../../components/vendor/MonitoringAlertsFeed';
import EventExtraResourceModal from '../../components/vendor/EventExtraResourceModal';
import EventExtraStaffModal from '../../components/vendor/EventExtraStaffModal';

import { getMyEvents, getStaffAssignments, getMyStaff, getMyIssues, getMyResources, patchIssue } from '../../services';

export default function Monitoring() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [staffAssignments, setStaffAssignments] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [resourceInventory, setResourceInventory] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateBulletinText, setUpdateBulletinText] = useState('');
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isEndEventModalOpen, setIsEndEventModalOpen] = useState(false);

  // Milestone Progress State (persisted per event)
  const [milestonesState, setMilestonesState] = useState({
    EVT002: [
      { id: 'm1', title: 'Setup & Inbound Logistics', time: '14:00', lead: 'Mike Johnson', status: 'done' },
      { id: 'm2', title: 'Sound & Stage AV Check', time: '16:00', lead: 'Marcus Sterling', status: 'done' },
      { id: 'm3', title: 'Guest Arrival & Registration', time: '17:45', lead: 'Chloe Bennett', status: 'current' },
      { id: 'm4', title: 'Main Wedding Ceremony', time: '18:30', lead: 'Sarah Williams', status: 'pending' },
      { id: 'm5', title: 'Banquet & Dinner Service', time: '20:00', lead: 'Elite Events Staff', status: 'pending' },
      { id: 'm6', title: 'Wrap-up & Load-out', time: '22:30', lead: 'Logistics Team', status: 'pending' },
    ],
    EVT003: [
      { id: 'm1', title: 'Hall Setup & Lighting Rig', time: '13:00', lead: 'Elena Rostova', status: 'done' },
      { id: 'm2', title: 'Keynote Tech & Mic Check', time: '15:30', lead: 'Mike Johnson', status: 'done' },
      { id: 'm3', title: 'Executive Welcome Reception', time: '18:00', lead: 'Sarah Williams', status: 'current' },
      { id: 'm4', title: 'Annual Awards Gala', time: '19:30', lead: 'Elena Rostova', status: 'pending' },
      { id: 'm5', title: 'Dessert & Networking', time: '21:00', lead: 'Chloe Bennett', status: 'pending' },
    ],
  });

  // On-site Staff Requests
  const [staffRequests, setStaffRequests] = useState([
    {
      id: 'req_1',
      staffName: 'Marcus Sterling',
      role: 'AV Specialist',
      requestText: 'Stage audio monitors need 2 additional XLR extensions before 18:00 soundcheck.',
      time: '6m ago',
    },
    {
      id: 'req_2',
      staffName: 'Chloe Bennett',
      role: 'Guest Relations',
      requestText: 'Guest count exceeded 140 at reception foyer; requesting 1 extra usher.',
      time: '12m ago',
    },
  ]);

  // Live Alerts Feed
  const [alertsFeed, setAlertsFeed] = useState([
    {
      id: 'al_1',
      type: 'success',
      text: 'Main sound reinforcement checks passed all dB levels at ballroom FOH.',
      time: '5m ago',
      source: 'Tech Team',
    },
    {
      id: 'al_2',
      type: 'warning',
      text: 'Ambient temperature near West Pavilion rising; HVAC thermostat adjusted to 20°C.',
      time: '14m ago',
      source: 'Venue Facility',
    },
    {
      id: 'al_3',
      type: 'info',
      text: 'Coordinator Sarah Williams checked in with Lead Client Emily Carter.',
      time: '28m ago',
      source: 'Concierge',
    },
  ]);

  // Contingency Plans
  const [contingencies, setContingencies] = useState([
    { id: 'rain', name: 'Weather Shelter Shift', desc: 'Seal outdoor verandas and redirect guests into Grand Galleria', status: 'ready' },
    { id: 'power', name: 'Auxiliary Generator Link', desc: 'Switch sound and chandelier lines to emergency 150kVA generator', status: 'ready' },
    { id: 'overflow', name: 'Overflow Seating Dispatch', desc: 'Deploy 4 reserve banquet tables (32 seats) from East storage', status: 'ready' },
  ]);

  // 1. Initial Data Fetch
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const [evs, assigns, stf, rsc, iss] = await Promise.all([
          getMyEvents().catch(() => []),
          getStaffAssignments().catch(() => []),
          getMyStaff().catch(() => []),
          getMyResources().catch(() => []),
          getMyIssues().catch(() => []),
        ]);

        if (!mounted) return;

        // Filter active/confirmed/live events
        const activeEvents = Array.isArray(evs)
          ? evs.filter((e) => ['live', 'confirmed', 'pending'].includes(String(e.status || '').toLowerCase()))
          : [];

        setEvents(activeEvents);
        setStaffAssignments(assigns || []);
        setStaffList(stf || []);
        setResourceInventory(rsc || []);
        setIssues(iss || []);

        // Integrate real on-site staff requests submitted from Staff portal
        const realStaffRequests = (iss || [])
          .filter(
            (i) =>
              (i.type === 'staff_request' ||
                i.category === 'Staff Request' ||
                (i.title && i.title.startsWith('Dispatch Request'))) &&
              ['open', 'pending'].includes(String(i.status || '').toLowerCase())
          )
          .map((i) => ({
            id: i.id,
            staffName: i.reporter || 'Staff Member',
            role: i.reporterRole || 'Staff',
            requestText: i.desc || i.description || i.title,
            time: i.createdAt
              ? new Date(i.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Recently',
            eventId: i.eventId || i.event,
          }));

        if (realStaffRequests.length > 0) {
          setStaffRequests((prev) => {
            const existingIds = new Set(prev.map((r) => r.id));
            const fresh = realStaffRequests.filter((r) => !existingIds.has(r.id));
            return [...fresh, ...prev];
          });
        }

        if (activeEvents.length > 0) {
          // Default to live event or first
          const liveEvt = activeEvents.find((e) => String(e.status).toLowerCase() === 'live');
          setSelectedEventId(liveEvt ? liveEvt.id : activeEvents[0].id);
        }
      } catch (err) {
        console.error('Failed to load live monitoring data:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  // Selected Event Object
  const selectedEvent = useMemo(() => {
    return events.find((e) => e.id === selectedEventId) || events[0] || null;
  }, [events, selectedEventId]);

  // Milestones for current event
  const currentMilestones = useMemo(() => {
    if (!selectedEvent) return [];
    return milestonesState[selectedEvent.id] || [
      { id: 'm1', title: 'Site Inspection & Inbound Setup', time: '13:00', status: 'done' },
      { id: 'm2', title: 'Technical AV & Power Inspection', time: '15:30', status: 'current' },
      { id: 'm3', title: 'Guest Welcome & Service', time: '18:00', status: 'pending' },
      { id: 'm4', title: 'Operational Breakdown', time: '22:00', status: 'pending' },
    ];
  }, [milestonesState, selectedEvent]);

  // Progress % calculated from milestones
  const progressPercent = useMemo(() => {
    if (!currentMilestones.length) return 50;
    const completed = currentMilestones.filter((m) => m.status === 'done').length;
    const current = currentMilestones.filter((m) => m.status === 'current').length ? 0.5 : 0;
    return Math.round(((completed + current) / currentMilestones.length) * 100);
  }, [currentMilestones]);

  // Staff on site for selected event
  const { activeStaffCount, totalStaffCount } = useMemo(() => {
    if (!selectedEvent) return { activeStaffCount: 0, totalStaffCount: 0 };
    const matchingAssigns = staffAssignments.filter(
      (a) => a.eventId === selectedEvent.id || a.eventName === selectedEvent.name
    );
    const total = matchingAssigns.length || 3;
    const active = matchingAssigns.filter((a) => a.status === 'accepted').length || Math.min(total, 2);
    return { activeStaffCount: active, totalStaffCount: total };
  }, [selectedEvent, staffAssignments]);

  // Risks for selected event
  const eventRisks = useMemo(() => {
    if (!selectedEvent) return [];
    const directRisks = issues.filter(
      (i) => (i.eventId === selectedEvent.id || !i.eventId) && String(i.status).toLowerCase() !== 'resolved'
    );
    if (directRisks.length > 0) return directRisks;

    // Fallback contextual live risks
    return [
      { id: 'r_1', title: 'Elevated venue hall noise floor near entrance', severity: 'low', location: 'Foyer Zone B', time: '12m ago' },
      { id: 'r_2', title: 'Catering dessert delivery delayed 15 minutes', severity: 'medium', location: 'Service Kitchen', time: '25m ago' },
    ];
  }, [issues, selectedEvent]);

  // Advance Next Milestone Action
  const handleAdvanceMilestone = useCallback(() => {
    if (!selectedEvent) return;
    setMilestonesState((prev) => {
      const list = [...(prev[selectedEvent.id] || currentMilestones)];
      const currentIdx = list.findIndex((m) => m.status === 'current');
      if (currentIdx !== -1) {
        list[currentIdx] = { ...list[currentIdx], status: 'done' };
        if (currentIdx + 1 < list.length) {
          list[currentIdx + 1] = { ...list[currentIdx + 1], status: 'current' };
          // Append to alerts feed
          setAlertsFeed((feed) => [
            {
              id: `al_${Date.now()}`,
              type: 'info',
              text: `Milestone "${list[currentIdx + 1].title}" is now ACTIVE.`,
              time: 'Just now',
              source: 'Milestone Engine',
            },
            ...feed,
          ]);
        }
      }
      return { ...prev, [selectedEvent.id]: list };
    });
  }, [selectedEvent, currentMilestones]);

  // Staff Request Handlers
  const handleApproveStaffRequest = useCallback((reqId) => {
    const approved = staffRequests.find((r) => r.id === reqId);
    setStaffRequests((prev) => prev.filter((r) => r.id !== reqId));
    if (approved) {
      if (reqId && !reqId.startsWith('req_')) {
        patchIssue(reqId, { status: 'resolved' }).catch(() => {});
      }
      setAlertsFeed((prev) => [
        {
          id: `al_${Date.now()}`,
          type: 'success',
          text: `Approved request from ${approved.staffName}: "${approved.requestText}"`,
          time: 'Just now',
          source: 'Coordinator Decision',
        },
        ...prev,
      ]);
    }
  }, [staffRequests]);

  const handleRejectStaffRequest = useCallback((reqId) => {
    setStaffRequests((prev) => prev.filter((r) => r.id !== reqId));
    if (reqId && !reqId.startsWith('req_')) {
      patchIssue(reqId, { status: 'rejected' }).catch(() => {});
    }
  }, []);

  // Contingency Trigger Action
  const handleTriggerContingency = useCallback((planId) => {
    setContingencies((prev) =>
      prev.map((c) => (c.id === planId ? { ...c, status: c.status === 'activated' ? 'ready' : 'activated' } : c))
    );
    const plan = contingencies.find((c) => c.id === planId);
    if (plan) {
      setAlertsFeed((prev) => [
        {
          id: `al_${Date.now()}`,
          type: 'warning',
          text: `EMERGENCY PROTOCOL ACTIVATED: ${plan.name} - ${plan.desc}`,
          time: 'Just now',
          source: 'Live Incident Command',
        },
        ...prev,
      ]);
    }
  }, [contingencies]);

  // Broadcast Bulletin Submit
  const handleBroadcastBulletin = (e) => {
    e.preventDefault();
    if (!updateBulletinText.trim()) return;

    setAlertsFeed((prev) => [
      {
        id: `al_${Date.now()}`,
        type: 'info',
        text: `BULLETIN: ${updateBulletinText.trim()}`,
        time: 'Just now',
        source: 'Sarah Williams (Lead Coordinator)',
      },
      ...prev,
    ]);

    setUpdateBulletinText('');
    setIsUpdateModalOpen(false);
  };

  // Conclude Event Confirm
  const handleConfirmEndEvent = () => {
    if (!selectedEvent) return;
    setEvents((prev) =>
      prev.map((ev) => (ev.id === selectedEvent.id ? { ...ev, status: 'completed' } : ev))
    );
    setAlertsFeed((prev) => [
      {
        id: `al_${Date.now()}`,
        type: 'success',
        text: `Event "${selectedEvent.name}" has officially concluded. Settlement batch dispatched to Admin payouts.`,
        time: 'Just now',
        source: 'Operations Director',
      },
      ...prev,
    ]);
    setIsEndEventModalOpen(false);
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

        {/* Event Selector Cards */}
        <MonitoringEventCards
          events={events}
          selectedEventId={selectedEvent?.id}
          onSelectEvent={(ev) => setSelectedEventId(ev.id)}
        />

        {/* Quick Operational Actions Bar */}
        <MonitoringQuickActions
          onUpdateEvent={() => setIsUpdateModalOpen(true)}
          onAllocateResources={() => setIsResourceModalOpen(true)}
          onAllocateStaff={() => setIsStaffModalOpen(true)}
          onEndEvent={() => setIsEndEventModalOpen(true)}
        />

        {/* Event Performance & Health KPI Card */}
        {selectedEvent && (
          <MonitoringStatsCard
            eventName={selectedEvent.name}
            progress={progressPercent}
            duration="2h 45m"
            durationSub="Started on time at 17:00"
            activeStaffCount={activeStaffCount}
            totalStaffCount={totalStaffCount}
            isLive={String(selectedEvent.status || '').toLowerCase() === 'live'}
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
                This message will immediately appear on all staff dashboards and on-site monitors.
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

        {/* Reusable Allocate Additional Resources Modal */}
        <EventExtraResourceModal
          isOpen={isResourceModalOpen}
          onClose={() => setIsResourceModalOpen(false)}
          resources={resourceInventory}
          onAddResource={(res) => {
            setAlertsFeed((prev) => [
              {
                id: `al_${Date.now()}`,
                type: 'info',
                text: `Allocated extra resource: ${res.name} (Qty: ${res.quantityNeeded || 1})`,
                time: 'Just now',
                source: 'Logistics Dispatch',
              },
              ...prev,
            ]);
            setIsResourceModalOpen(false);
          }}
        />

        {/* Reusable Allocate Additional Staff Modal */}
        <EventExtraStaffModal
          isOpen={isStaffModalOpen}
          onClose={() => setIsStaffModalOpen(false)}
          staffList={staffList}
          onAddStaff={(stf) => {
            setAlertsFeed((prev) => [
              {
                id: `al_${Date.now()}`,
                type: 'info',
                text: `Deployed reserve staff member: ${stf.name} (${stf.role || 'Staff'})`,
                time: 'Just now',
                source: 'Workforce Dispatch',
              },
              ...prev,
            ]);
            setIsStaffModalOpen(false);
          }}
        />
      </div>
    </div>
  );
}

