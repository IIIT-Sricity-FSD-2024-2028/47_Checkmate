/**
 * ============================================================================
 * CLIENT COORDINATION & MESSAGES (Coordination.jsx)
 * ============================================================================
 * Role: Client Portal
 * Location: src/pages/client/Coordination.jsx
 *
 * Purpose:
 *   Real-time coordination channel for clients to message directly
 *   with their event vendors, coordinators, and on-site staff.
 *   Uses the shared backend /api/messages endpoints.
 * ============================================================================
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Send,
  Building2,
  Calendar,
  Search,
  Paperclip,
  Smile,
  Clock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

import '../../styles/client.css';
import { getAuthSession, getAuthUser } from '../../services/auth/authStorage';
import { getMyEvents } from '../../services/eventService';
import { getMessageThread, sendMessage } from '../../services/messageService';

export default function ClientCoordination() {
  const session = getAuthSession();
  const user = getAuthUser() || session?.user || {};
  const clientName = user?.name || session?.name || 'Emily Carter';
  const clientInitials = clientName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const chatBottomRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setInputText((prev) => `${prev ? prev + " " : ""}📎 [Attached: ${file.name}]`);
      e.target.value = "";
    }
  };

  // Load client events
  useEffect(() => {
    let mounted = true;
    async function loadEvents() {
      try {
        const myEvts = await getMyEvents();
        if (mounted) {
          const list = Array.isArray(myEvts) ? myEvts : [];
          setEvents(list);
          if (list.length > 0 && !selectedEventId) {
            setSelectedEventId(list[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load client events for coordination:', err);
      }
    }
    loadEvents();
    return () => {
      mounted = false;
    };
  }, []);

  const selectedEvent = useMemo(() => {
    return (
      events.find((e) => e.id === selectedEventId) ||
      events[0] || { id: null, name: 'No events yet', vendor: '' }
    );
  }, [events, selectedEventId]);

  // Each event has its own conversation with the vendor
  const activeThreadId = selectedEvent.id ? `client-${selectedEvent.id}` : null;

  // Load and poll messages
  useEffect(() => {
    let mounted = true;

    async function loadMessages() {
      if (!activeThreadId) return;
      try {
        const thread = await getMessageThread(activeThreadId);
        if (mounted) setMessages(Array.isArray(thread) ? thread : []);
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
    }

    loadMessages();
    const interval = setInterval(loadMessages, 4000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [activeThreadId]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Filter events
  const filteredEvents = useMemo(() => {
    if (!searchQuery) return events;
    const q = searchQuery.toLowerCase();
    return events.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.vendor && e.vendor.toLowerCase().includes(q)) ||
        e.id.toLowerCase().includes(q)
    );
  }, [events, searchQuery]);

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || sending || !activeThreadId) return;

    const newMsg = {
      threadId: activeThreadId,
      sender: clientName,
      initials: clientInitials,
      self: true,
      text: text,
      avatar: 'blue',
    };

    // Optimistic update
    setMessages((prev) => [
      ...prev,
      {
        ...newMsg,
        id: `local_${Date.now()}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setInputText('');

    try {
      setSending(true);
      await sendMessage(newMsg);
    } catch (err) {
      console.error('Failed to post client message:', err);
      setMessages((prev) => prev.filter((m) => m.text !== text || !String(m.id).startsWith("local_")));
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="client-content-wrap">
      {/* Title */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Event Messages & Coordination
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
          Real-time communications with dedicated event coordinators and vendor leads.
        </p>
      </div>

      <div className="msg-shell">
        {/* Left Panel: Assigned Events List */}
        <div className="msg-left">
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Your Events ({events.length})
            </h4>
          </div>

          <div className="msg-search-wrap">
            <Search size={14} className="msg-search-icon" />
            <input
              type="text"
              className="msg-search"
              placeholder="Filter events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="msg-conv-list">
            {filteredEvents.map((ev) => {
              const isActive = (selectedEvent?.id || '') === ev.id;
              const initials = (ev.name || 'EV')
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

              return (
                <div
                  key={ev.id}
                  className={`msg-conv-item ${isActive ? 'active' : ''}`}
                  onClick={() => setSelectedEventId(ev.id)}
                >
                  <div className="msg-conv-avatar">
                    {initials}
                    <div className="online-dot" />
                  </div>
                  <div className="msg-conv-body">
                    <div className="msg-conv-name">
                      <span>{ev.name}</span>
                      <span className="msg-conv-time">
                        {String(ev.status || 'Active').toUpperCase()}
                      </span>
                    </div>
                    <div className="msg-conv-preview">
                      Coordinator: {ev.vendor || 'Elite Events Co.'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Chat Thread */}
        <div className="msg-right">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-left">
              <div className="chat-avatar">
                {selectedEvent.name
                  ? selectedEvent.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()
                  : 'EV'}
                <div className="online-dot" />
              </div>
              <div>
                <div className="chat-name">
                  <span>{selectedEvent.vendor}</span>
                  <span
                    style={{
                      fontSize: '10px',
                      background: 'rgba(34,197,94,0.15)',
                      color: '#22c55e',
                      padding: '1px 8px',
                      borderRadius: '10px',
                      fontWeight: 700,
                    }}
                  >
                    Vendor Desk
                  </span>
                </div>
                <div className="chat-status">● Online • {selectedEvent.name}</div>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="chat-messages">
            {messages.map((m, idx) => {
              const isMe =
                m.sender?.toLowerCase() === clientName.toLowerCase();

              return (
                <div key={m.id || idx} className={`msg-bubble-wrap ${isMe ? 'me' : 'them'}`}>
                  <div className="msg-sender">
                    <span>{m.sender || (isMe ? 'You' : 'Coordinator')}</span>
                    <span
                      className={`sender-badge ${
                        isMe ? 'badge-client' : 'badge-vendor'
                      }`}
                    >
                      {m.role || (isMe ? 'Client' : 'Vendor Lead')}
                    </span>
                  </div>

                  <div className="msg-bubble">{m.text}</div>
                  <div className="msg-time">{m.time || 'Just now'}</div>
                </div>
              );
            })}
            <div ref={chatBottomRef} />
          </div>

          {/* Input Bar */}
          <form className="chat-input-bar" onSubmit={handleSendMessage}>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileSelect}
            />
            <button
              type="button"
              className="chat-attach-btn"
              title="Attach photo or floorplan"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip size={16} />
            </button>

            <input
              type="text"
              className="chat-input"
              placeholder={`Message coordinator regarding ${selectedEvent.name}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />

            <button
              type="button"
              className="chat-emoji-btn"
              title="Add reaction"
              onClick={() => setInputText((prev) => prev + ' 🎉')}
            >
              <Smile size={16} />
            </button>

            <button
              type="submit"
              className="chat-send-btn"
              disabled={!inputText.trim() || sending}
              title="Send message"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

