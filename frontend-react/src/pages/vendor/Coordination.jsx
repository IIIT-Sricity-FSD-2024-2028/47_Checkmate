import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Radio, Shield, Calendar } from 'lucide-react';
import VendorTopBar from '../../components/vendor/VendorTopBar';
import CoordinationParticipants from '../../components/vendor/CoordinationParticipants';
import CoordinationTemplates from '../../components/vendor/CoordinationTemplates';
import CoordinationChat from '../../components/vendor/CoordinationChat';

import { getMyEvents } from '../../services';
import { getAuthUser } from '../../services/auth/authStorage';

const CHAT_STORAGE_KEY_EVENT = 'eventpro_coord_event_msgs_v1';
const CHAT_STORAGE_KEY_ADMIN = 'eventpro_coord_admin_msgs_v1';

export default function Coordination({ mode = 'event' }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Detect active mode from prop or path
  const [activeTab, setActiveTab] = useState(() => {
    if (location.pathname.includes('coordination-admin') || mode === 'admin') {
      return 'admin';
    }
    return 'event';
  });

  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('EVT002');
  const [inputText, setInputText] = useState('');

  // Current session user
  const currentUser = useMemo(() => {
    const user = getAuthUser();
    return user?.name || 'Sarah Williams';
  }, []);

  // Event coordination messages
  const [eventMessages, setEventMessages] = useState(() => {
    try {
      const stored = localStorage.getItem(CHAT_STORAGE_KEY_EVENT);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return [
      {
        id: 'msg_1',
        sender: 'Mike Johnson',
        role: 'Event Coordinator',
        text: 'Morning everyone! Tech Summit and Sarah & Mike Wedding staging equipment is dispatched.',
        time: '09:15 AM',
        self: false,
      },
      {
        id: 'msg_2',
        sender: 'Sarah Williams',
        role: 'Lead Vendor',
        text: 'Confirmed. Marcus, please double check the wireless handheld mics on Stage A.',
        time: '09:22 AM',
        self: true,
      },
      {
        id: 'msg_3',
        sender: 'Marcus Sterling',
        role: 'AV Specialist',
        text: 'Mics are on frequency 524MHz, zero interference detected. Batteries at 100%.',
        time: '09:30 AM',
        self: false,
      },
      {
        id: 'msg_4',
        sender: 'Emily Carter',
        role: 'Client',
        text: 'Hi Sarah, can we ensure the welcome photo arch is positioned near the foyer entrance?',
        time: '09:42 AM',
        self: false,
      },
      {
        id: 'msg_5',
        sender: 'Sarah Williams',
        role: 'Lead Vendor',
        text: 'Already done Emily! Floral team finalized the arch placement 10 minutes ago.',
        time: '09:45 AM',
        self: true,
      },
    ];
  });

  // Admin coordination messages
  const [adminMessages, setAdminMessages] = useState(() => {
    try {
      const stored = localStorage.getItem(CHAT_STORAGE_KEY_ADMIN);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return [
      {
        id: 'adm_1',
        sender: 'Aarav Mehta',
        role: 'Platform Admin',
        text: 'Hello Elite Events Co. Your recent business insurance renewal has been reviewed and marked as verified in the admin registry.',
        time: 'Yesterday 14:10',
        self: false,
      },
      {
        id: 'adm_2',
        sender: 'Sarah Williams',
        role: 'Vendor',
        text: 'Thank you Aarav. Also regarding the payout for BK004 (25th Anniversary Banquet), will the ACH transfer settle on Friday?',
        time: 'Yesterday 14:25',
        self: true,
      },
      {
        id: 'adm_3',
        sender: 'Aarav Mehta',
        role: 'Platform Admin',
        text: 'Yes, batch #882 is scheduled for Friday morning clearance ($19,800 net after 10% platform fee). Everything is in order.',
        time: 'Yesterday 14:40',
        self: false,
      },
    ];
  });

  // Load events
  useEffect(() => {
    let mounted = true;
    async function loadEvents() {
      try {
        const evs = await getMyEvents();
        if (mounted && Array.isArray(evs) && evs.length > 0) {
          setEvents(evs);
          if (!selectedEventId) {
            setSelectedEventId(evs[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load events for coordination hub:', err);
      }
    }
    loadEvents();
    return () => {
      mounted = false;
    };
  }, [selectedEventId]);

  // Persist messages
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY_EVENT, JSON.stringify(eventMessages));
    } catch {
      // ignore
    }
  }, [eventMessages]);

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY_ADMIN, JSON.stringify(adminMessages));
    } catch {
      // ignore
    }
  }, [adminMessages]);

  // Participants roster
  const participants = useMemo(() => {
    if (activeTab === 'admin') {
      return [
        { id: 'u1', name: currentUser, role: 'Lead Vendor Coordinator', avatar: 'sw', isSelf: true },
        { id: 'u2', name: 'Aarav Mehta', role: 'Super Administrator', avatar: 'aj', isSelf: false },
        { id: 'u3', name: 'Finance Desk', role: 'Automated Billing Service', avatar: 'mb', isSelf: false },
      ];
    }

    return [
      { id: 'p1', name: currentUser, role: 'Event Coordinator', avatar: 'sw', isSelf: true },
      { id: 'p2', name: 'Mike Johnson', role: 'Event Staff', avatar: 'mb', isSelf: false },
      { id: 'p3', name: 'Marcus Sterling', role: 'AV Specialist', avatar: 'aj', isSelf: false },
      { id: 'p4', name: 'Emily Carter', role: 'Host / Client', avatar: 'ed', isSelf: false },
      { id: 'p5', name: 'Chloe Bennett', role: 'Guest Relations', avatar: 'sw', isSelf: false },
    ];
  }, [activeTab, currentUser]);

  // Send Message Action
  const handleSendMessage = useCallback(() => {
    if (!inputText.trim()) return;

    const timeStr = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const newMsg = {
      id: `msg_${Date.now()}`,
      sender: currentUser,
      role: 'Vendor Coordinator',
      text: inputText.trim(),
      time: timeStr,
      self: true,
    };

    if (activeTab === 'admin') {
      setAdminMessages((prev) => [...prev, newMsg]);
    } else {
      setEventMessages((prev) => [...prev, newMsg]);
    }

    setInputText('');
  }, [inputText, activeTab, currentUser]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(tab === 'admin' ? '/vendor/coordination-admin' : '/vendor/coordination', { replace: true });
  };

  const selectedEventObj = events.find((e) => e.id === selectedEventId) || { name: 'Sarah & Mike Wedding' };

  return (
    <div className="vendor-dashboard">
      <VendorTopBar title="Coordination Hub" />

      <div className="content" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Navigation Tabs */}
        <div className="ch-section-tabs">
          <button
            type="button"
            className={`ch-section-tab ${activeTab === 'event' ? 'active' : ''}`}
            onClick={() => handleTabChange('event')}
          >
            <Radio size={16} />
            <span>Event Coordination</span>
          </button>

          <button
            type="button"
            className={`ch-section-tab ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => handleTabChange('admin')}
          >
            <Shield size={16} />
            <span>Admin Escalation Channel</span>
          </button>
        </div>

        {/* Intro Row */}
        <div className="ch-intro">
          <h2>
            {activeTab === 'admin'
              ? 'Admin Escalation & Support Channel'
              : `Event Coordination — ${selectedEventObj.name || 'Live Event'}`}
          </h2>
          <p>
            {activeTab === 'admin'
              ? 'Direct synchronized thread between Vendor and Checkmate System Administrators'
              : 'Communicate live with your deployed staff members, clients, and AV technicians'}
          </p>
        </div>

        {/* Event Selector (only in event mode) */}
        {activeTab === 'event' && events.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Calendar size={16} className="text-pink" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Active Event Thread:
            </span>
            <select
              className="ri-select"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              style={{ width: 'auto', minWidth: '260px', padding: '8px 14px' }}
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name || ev.title} ({ev.date || 'TBA'})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Participants Strip */}
        <CoordinationParticipants participants={participants} />

        {/* Quick Message Templates */}
        <CoordinationTemplates onSelectTemplate={(tmpl) => setInputText(tmpl)} />

        {/* Chat Component */}
        <div className="ch-grid">
          <CoordinationChat
            messages={activeTab === 'admin' ? adminMessages : eventMessages}
            inputText={inputText}
            onInputChange={setInputText}
            onSendMessage={handleSendMessage}
            channelTitle={
              activeTab === 'admin'
                ? 'Checkmate Admin Helpdesk & Moderation'
                : `${selectedEventObj.name || 'Event'} Operational Stream`
            }
            channelSubtitle={
              activeTab === 'admin'
                ? 'Responses typically under 5 minutes'
                : 'Broadcasting to all on-site personnel'
            }
            currentUser={currentUser}
          />
        </div>
      </div>
    </div>
  );
}

