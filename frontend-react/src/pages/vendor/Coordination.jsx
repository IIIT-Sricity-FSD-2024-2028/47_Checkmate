/**
 * ============================================================================
 * VENDOR COORDINATION HUB (Coordination.jsx)
 * ============================================================================
 * Role: Vendor, route /vendor/coordination
 *
 * Purpose:
 *   Client Enquiries: talk to clients about events that have not started.
 *   Active Events: for each confirmed / approved / live event, talk to its
 *   staff team or its client. (It used to list LIVE events only, so a staff
 *   member writing about a confirmed event was never seen by the vendor.)
 *   Admin Support: the vendor's own conversation with the admin team.
 *   Messages arrive live (socket); unread counts show on every row and tab.
 *   Clients and staff see the same conversations in their own portals.
 * ============================================================================
 */

import React, { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Radio, User, Users } from 'lucide-react';

import VendorTopBar from '../../components/vendor/VendorTopBar';
import ConversationList from '../../components/chat/ConversationList';
import ChatWindow from '../../components/chat/ChatWindow';
import useThreadChat from '../../hooks/useThreadChat';
import useLiveChat from '../../hooks/useLiveChat';
import useUnreadCounts from '../../hooks/useUnreadCounts';
import '../../styles/chat-live.css';
import { getMyEvents } from '../../services/eventService';
import { getStaffAssignments } from '../../services/staffService';
import { getAuthUser } from '../../services/auth/authStorage';

import '../../styles/vendor.css';
import '../client/client.css';

const REFRESH_MS = 5000;
const ENQUIRY_STATUSES = ['pending', 'waiting', 'confirmed', 'approved'];
// Events whose staff team the vendor can talk to (staff are assigned from approval on)
const ACTIVE_STATUSES = ['confirmed', 'approved', 'live'];
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

  // Unread messages per conversation (badges), pushed live
  const unread = useUnreadCounts();

  // The vendor's own conversation with the admin team
  const adminChat = useLiveChat({ kind: 'admin' });
  const isAdminSection = section === 'admin';

  const isLiveSection = section === 'live';
  const liveEvents = useMemo(() => events.filter((e) => ACTIVE_STATUSES.includes(statusOf(e))), [events]);
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
      ? 'No confirmed or live events right now.'
      : 'No client enquiries right now.'
    : isStaffChat
    ? 'No messages yet. Say hello to the team.'
    : 'No messages yet. Say hello to your client.';

  const error = loadError || (isAdminSection ? adminChat.error : chat.error);

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
            <span>Active Events ({liveEvents.length})</span>
            {liveEvents.reduce((n, e) => n + (unread.threads[`staff-${e.id}`] || 0), 0) > 0 && (
              <span className="chat-unread-badge">{liveEvents.reduce((n, e) => n + (unread.threads[`staff-${e.id}`] || 0), 0)}</span>
            )}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isAdminSection}
            className={`ch-section-tab ${isAdminSection ? 'active' : ''}`}
            onClick={() => setSection('admin')}
          >
            <User size={16} />
            <span>Admin Support</span>
            {unread.threads['admin-chat'] > 0 && <span className="chat-unread-badge">{unread.threads['admin-chat']}</span>}
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
                {unread.threads[`staff-${event.id}`] > 0 && <span className="chat-unread-badge">{unread.threads[`staff-${event.id}`]}</span>}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={audience === 'client'}
                className={`so-tab ${audience === 'client' ? 'active' : ''}`}
                onClick={() => setAudience('client')}
              >
                <User size={13} /> Client
                {unread.threads[`client-${event.id}`] > 0 && <span className="chat-unread-badge">{unread.threads[`client-${event.id}`]}</span>}
              </button>
            </div>
            {isStaffChat && (
              <span className="hub-team">
                {team.length ? team.map((a) => a.staffName).join(', ') : 'No staff assigned to this event'}
              </span>
            )}
          </div>
        )}

        {isAdminSection ? (
          <div className="cl-chat-layout">
            <ConversationList single={{ initials: 'AD', title: 'Admin Support', subtitle: 'Platform administrators' }} />
            <ChatWindow
              title="Admin Support"
              subtitle="Questions about payouts, accounts or the platform"
              showOnline
              messages={adminChat.messages}
              connected={adminChat.connected}
              emptyText="No messages yet. Ask the admin team anything."
              isMine={(m) => String(m.senderEmail || '').toLowerCase() === String(user?.email || '').toLowerCase()}
              onSend={adminChat.send}
            />
          </div>
        ) : (
        <div className="cl-chat-layout">
          <ConversationList
            events={visibleEvents}
            selectedId={event?.id}
            onSelect={(id) => setSelected((prev) => ({ ...prev, [section]: id }))}
            search={search}
            onSearch={setSearch}
            getSubtitle={(ev) => `Client: ${ev.client || 'Unknown'}`}
            getBadge={(ev) => unread.threads[`${isStaffChat ? 'staff' : 'client'}-${ev.id}`] || 0}
          />
          <ChatWindow
            title={event ? (isStaffChat ? `${event.name} Team` : event.client || 'Client') : 'No conversation'}
            subtitle={event?.name}
            showOnline={Boolean(event)}
            messages={chat.messages}
            connected={chat.connected}
            emptyText={emptyText}
            isMine={(m) => m.senderId === user?.id || m.sender === user?.name}
            disabled={!event}
            onSend={chat.send}
          />
        </div>
        )}
      </div>
    </div>
  );
}
