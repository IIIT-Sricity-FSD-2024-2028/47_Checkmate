/**
 * ============================================================================
 * VENDOR COORDINATION HUB (Coordination.jsx)
 * ============================================================================
 * Role: Vendor, route /vendor/coordination
 *
 * Purpose:
 *   Client Enquiries: talk to clients about events that have not started.
 *   Live Events: for each live event, talk to its staff team or its client.
 *   Clients and staff see the same conversations in their own portals.
 * ============================================================================
 */

import React, { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Radio, User, Users } from 'lucide-react';

import VendorTopBar from '../../components/vendor/VendorTopBar';
import ConversationList from '../../components/chat/ConversationList';
import ChatWindow from '../../components/chat/ChatWindow';
import useThreadChat from '../../hooks/useThreadChat';
import { getMyEvents } from '../../services/eventService';
import { getStaffAssignments } from '../../services/staffService';
import { getAuthUser } from '../../services/auth/authStorage';

import '../../styles/vendor.css';
import '../client/client.css';

const REFRESH_MS = 5000;
const ENQUIRY_STATUSES = ['pending', 'waiting', 'confirmed', 'approved'];
const CLOSED_ASSIGNMENTS = ['rejected', 'declined'];

const statusOf = (event) => String(event.status || '').toLowerCase();

export default function Coordination() {
  const user = getAuthUser();
  const [section, setSection] = useState('enquiries');
  const [audience, setAudience] = useState('staff');
  const [events, setEvents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selected, setSelected] = useState({ enquiries: null, live: null });
  const [search, setSearch] = useState('');
  const [loadError, setLoadError] = useState(null);

  // Keeps refreshing, so an event that goes live moves across by itself
  useEffect(() => {
    let isMounted = true;
    const load = () =>
      Promise.all([getMyEvents(), getStaffAssignments()])
        .then(([evs, assigns]) => {
          if (!isMounted) return;
          setEvents(Array.isArray(evs) ? evs : []);
          setAssignments(Array.isArray(assigns) ? assigns : []);
          setLoadError(null);
        })
        .catch((err) => isMounted && setLoadError(err.message || 'Could not load your events.'));
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  const isLiveSection = section === 'live';
  const liveEvents = useMemo(() => events.filter((e) => statusOf(e) === 'live'), [events]);
  const enquiryEvents = useMemo(() => events.filter((e) => ENQUIRY_STATUSES.includes(statusOf(e))), [events]);

  const sectionEvents = isLiveSection ? liveEvents : enquiryEvents;
  const query = search.trim().toLowerCase();
  const visibleEvents = sectionEvents.filter(
    (e) => !query || e.name?.toLowerCase().includes(query) || e.client?.toLowerCase().includes(query)
  );
  const event = sectionEvents.find((e) => e.id === selected[section]) || sectionEvents[0] || null;

  const team = useMemo(
    () =>
      assignments.filter(
        (a) => a.eventId === event?.id && !CLOSED_ASSIGNMENTS.includes(String(a.status).toLowerCase())
      ),
    [assignments, event]
  );

  const isStaffChat = isLiveSection && audience === 'staff';
  const threadId = event ? `${isStaffChat ? 'staff' : 'client'}-${event.id}` : null;
  const chat = useThreadChat(threadId);

  const emptyText = !event
    ? isLiveSection
      ? 'No events are live right now.'
      : 'No client enquiries right now.'
    : isStaffChat
    ? 'No messages yet. Say hello to the team.'
    : 'No messages yet. Say hello to your client.';

  const error = loadError || chat.error;

  return (
    <div className="vendor-dashboard">
      <VendorTopBar title="Coordination Hub" />

      <div className="content" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="ch-section-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={!isLiveSection}
            className={`ch-section-tab ${!isLiveSection ? 'active' : ''}`}
            onClick={() => setSection('enquiries')}
          >
            <MessageSquare size={16} />
            <span>Client Enquiries ({enquiryEvents.length})</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isLiveSection}
            className={`ch-section-tab ${isLiveSection ? 'active' : ''}`}
            onClick={() => setSection('live')}
          >
            <Radio size={16} />
            <span>Live Events ({liveEvents.length})</span>
          </button>
        </div>

        {error && <div className="cl-client-error">{error}</div>}

        {isLiveSection && event && (
          <div className="hub-audience">
            <div className="so-tabs" role="tablist" style={{ marginBottom: 0 }}>
              <button
                type="button"
                role="tab"
                aria-selected={audience === 'staff'}
                className={`so-tab ${audience === 'staff' ? 'active' : ''}`}
                onClick={() => setAudience('staff')}
              >
                <Users size={13} /> Staff Team ({team.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={audience === 'client'}
                className={`so-tab ${audience === 'client' ? 'active' : ''}`}
                onClick={() => setAudience('client')}
              >
                <User size={13} /> Client
              </button>
            </div>
            {isStaffChat && (
              <span className="hub-team">
                {team.length ? team.map((a) => a.staffName).join(', ') : 'No staff assigned to this event'}
              </span>
            )}
          </div>
        )}

        <div className="cl-chat-layout">
          <ConversationList
            events={visibleEvents}
            selectedId={event?.id}
            onSelect={(id) => setSelected((prev) => ({ ...prev, [section]: id }))}
            search={search}
            onSearch={setSearch}
            getSubtitle={(ev) => `Client: ${ev.client || 'Unknown'}`}
          />
          <ChatWindow
            title={event ? (isStaffChat ? `${event.name} Team` : event.client || 'Client') : 'No conversation'}
            subtitle={event?.name}
            showOnline={Boolean(event)}
            messages={chat.messages}
            emptyText={emptyText}
            isMine={(m) => m.senderId === user?.id || m.sender === user?.name}
            disabled={!event}
            onSend={chat.send}
          />
        </div>
      </div>
    </div>
  );
}
