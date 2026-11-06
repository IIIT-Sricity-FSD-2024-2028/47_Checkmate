/**
 * ============================================================
 * PAGE: Staff Messages & Coordination (Messages.jsx)
 * ============================================================
 * Purpose:
 *   Real-time messaging hub for operational event staff to coordinate
 *   directly with Vendors and Clients. Allows staff to chat across
 *   assigned live events and dispatch on-site resource/staff requests
 *   to Vendor Monitoring.
 *
 * APIs Used:
 *   - GET /api/staff-assignments : Fetches assigned events for this staff member
 *   - GET /api/events            : Fetches event details and vendor contacts
 *   - GET /api/messages/:thread  : Fetches chat messages for the selected thread
 *   - POST /api/messages         : Posts a new chat message
 *   - POST /api/issues           : Dispatches on-site staff request to Vendor Monitoring
 * ============================================================
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Send,
  Paperclip,
  Smile,
  Plus,
  Search,
  Building2,
  User,
  Clock,
  X,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Boxes,
} from 'lucide-react';
import '../../styles/staff.css';
import Toast from './components/Toast';
import {
  getSessionUser,
  fetchStaffAssignments,
  fetchEvents,
  fetchMessageThread,
  sendMessage,
  createStaffRequest,
} from '../../services/staffApi';

export default function StaffMessages() {
  const [session] = useState(() => getSessionUser());

  // Conversation list & assignments
  const [assignments, setAssignments] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const activeTab = 'vendor';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventId, setSelectedEventId] = useState(null);

  // Chat messages
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const chatBottomRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setInputText((prev) => `${prev ? prev + " " : ""}📎 [Attached: ${file.name}]`);
      e.target.value = "";
    }
  };

  // Quick Dispatch Request Modal
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [reqEventId, setReqEventId] = useState('');
  const [reqType, setReqType] = useState('resource'); // 'resource' | 'staff' | 'technical' | 'logistics'
  const [reqItem, setReqItem] = useState('');
  const [reqQty, setReqQty] = useState(1);
  const [reqDesc, setReqDesc] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState(null);

  // 1. Load staff assignments & events on mount
  useEffect(() => {
    let mounted = true;

    async function initData() {
      try {
        const [assigns, evts] = await Promise.all([
          fetchStaffAssignments().catch(() => []),
          fetchEvents().catch(() => []),
        ]);

        if (!mounted) return;

        const myName = (session.name || '').trim().toLowerCase();
        const myEmail = (session.email || '').toLowerCase();
        const staffId = session.staffId;

        // Filter assignments matching this staff member
        const mine = Array.isArray(assigns)
          ? assigns.filter((a) => {
              if (staffId && a.staffId === staffId) return true;
              if (a.staffName && a.staffName.trim().toLowerCase() === myName) return true;
              return false;
            })
          : [];

        // Only current work: finished events drop off, live ones come first
        const eventList = Array.isArray(evts) ? evts : [];
        const statusOf = (a) => eventList.find((e) => e.id === a.eventId)?.status;
        const current = mine
          .filter((a) => !['completed', 'rejected', 'cancelled'].includes(statusOf(a)))
          .sort((a, b) => Number(statusOf(b) === 'live') - Number(statusOf(a) === 'live'));
        setAssignments(current);
        setAllEvents(Array.isArray(evts) ? evts : []);

        // Default to the first event this person is assigned to
        if (current.length > 0) {
          const firstEvtId = current[0].eventId || current[0].id;
          setSelectedEventId(firstEvtId);
          setReqEventId(firstEvtId);
        }
      } catch (err) {
        console.error('Failed to initialize staff conversations:', err);
      }
    }

    initData();
    return () => {
      mounted = false;
    };
  }, [session]);

  // Each event has one conversation between the vendor and its staff
  const currentThreadKey = selectedEventId ? `staff-${selectedEventId}` : null;

  // Selected event metadata
  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return null;
    return (
      allEvents.find((e) => e.id === selectedEventId) ||
      assignments.find((a) => (a.eventId || a.id) === selectedEventId) || {
        id: selectedEventId,
        name: 'Live Coordination Event',
        vendor: 'Elite Events Co.',
        status: 'Active',
      }
    );
  }, [selectedEventId, allEvents, assignments]);

  // 2. Fetch messages for the active thread & poll every 4 seconds
  useEffect(() => {
    let mounted = true;

    async function loadThread() {
      if (!currentThreadKey) return;
      try {
        const data = await fetchMessageThread(currentThreadKey);
        if (mounted) setMessages(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        if (mounted) setLoadingMessages(false);
      }
    }

    setLoadingMessages(true);
    loadThread();

    const pollInterval = setInterval(loadThread, 4000);
    return () => {
      mounted = false;
      clearInterval(pollInterval);
    };
  }, [currentThreadKey]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Filtered list of assigned events / conversations
  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    // Map assigned events to conversation cards
    const list = assignments.map((a) => {
      const evId = a.eventId || a.id;
      const matchedEvt = allEvents.find((e) => e.id === evId);
      const name = a.eventName || matchedEvt?.name || `Event ${evId}`;
      const vendorName = matchedEvt?.vendor || 'Elite Events Co.';
      const status = a.status || matchedEvt?.status || 'Confirmed';

      return {
        id: evId,
        name,
        vendor: vendorName,
        status,
        lastMsg: matchedEvt?.date || '',
        time: '',
        initials: (name || 'E')
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase(),
        unread: 0,
      };
    });

    const displayList = list;

    if (!query) return displayList;
    return displayList.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.vendor.toLowerCase().includes(query) ||
        c.status.toLowerCase().includes(query)
    );
  }, [assignments, allEvents, searchQuery]);

  // 3. Handle sending a chat message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || sending || !currentThreadKey) return;

    const myInitials = (session.name || 'Staff')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const newMsg = {
      threadId: currentThreadKey,
      sender: session.name,
      initials: myInitials,
      self: true,
      text: text,
      avatar: 'pink',
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
      console.error('Failed to post message to backend:', err);
      setMessages((prev) => prev.filter((m) => m.text !== text || !String(m.id).startsWith("local_")));
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  // 4. Handle dispatching an on-site staff request
  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!reqItem.trim()) {
      alert('Please specify the requested item or staff role.');
      return;
    }
    if (reqQty < 1) {
      alert('Quantity must be at least 1.');
      return;
    }

    try {
      setSubmittingRequest(true);
      const targetEvt =
        allEvents.find((ev) => ev.id === reqEventId) ||
        assignments.find((a) => (a.eventId || a.id) === reqEventId);

      const requestPayload = {
        eventId: reqEventId || selectedEventId || 'EVT002',
        eventName: targetEvt?.name || selectedEvent?.name || 'Assigned Event',
        type: reqType,
        item: reqItem.trim(),
        qty: parseInt(reqQty, 10),
        desc: reqDesc.trim(),
      };

      await createStaffRequest(requestPayload);

      // Toast feedback
      setToastMessage({
        text: `✓ Dispatch request for ${reqQty}x ${reqItem} dispatched to Vendor!`,
        type: 'success',
      });
      setTimeout(() => setToastMessage(null), 4000);

      // Add to local chat feed
      setMessages((prev) => [
        ...prev,
        {
          id: `req_${Date.now()}`,
          sender: session.name || 'Mike Johnson',
          initials: 'MJ',
          self: true,
          text: `📋 Dispatch Request: ${reqQty}x ${reqItem} (${reqType})${
            reqDesc ? ' — "' + reqDesc + '"' : ''
          }`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          avatar: 'pink',
          isRequest: true,
        },
      ]);

      // Reset modal
      setReqItem('');
      setReqQty(1);
      setReqDesc('');
      setIsRequestModalOpen(false);
    } catch (err) {
      alert(`Error submitting dispatch request: ${err.message}`);
    } finally {
      setSubmittingRequest(false);
    }
  };

  return (
    <div className="staff-page-container">
      {/* Toast popup */}
      {toastMessage && <Toast message={toastMessage.text} type={toastMessage.type} />}

      <div style={{ marginBottom: '18px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          Messages & Coordination
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text2)', margin: '4px 0 0' }}>
          Communicate directly with Event Vendors and Clients in real time.
        </p>
      </div>

      <div className="msg-shell">
        {/* ── LEFT PANEL: CONVERSATIONS ── */}
        <div className="msg-left">
          {/* Tabs */}
          <div className="msg-tabs">
            <div
              className={`msg-tab ${activeTab === 'vendor' ? 'msg-tab-vendor' : 'msg-tab-client'}`}
            >
              <Building2 size={13} />
              <span>Vendor</span>
              <span className="tab-badge">{filteredConversations.length}</span>
            </div>
          </div>

          {/* Search */}
          <div className="msg-search-wrap">
            <Search className="msg-search-icon" size={14} />
            <input
              type="text"
              className="msg-search"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Conversation List */}
          <div className="msg-conv-list">
            {filteredConversations.map((conv) => {
              const isActive = selectedEventId === conv.id;
              return (
                <div
                  key={conv.id}
                  className={`msg-conv-item ${isActive ? 'active' : ''}`}
                  onClick={() => setSelectedEventId(conv.id)}
                >
                  <div className="msg-conv-avatar">
                    {conv.initials}
                    <div className="online-dot" />
                  </div>
                  <div className="msg-conv-body">
                    <div className="msg-conv-name">
                      <span>{conv.name}</span>
                      <span className="msg-conv-time">{conv.time}</span>
                    </div>
                    <div className="msg-conv-preview">
                      {activeTab === 'vendor' ? conv.vendor : 'Client Coordination'}
                    </div>
                  </div>
                  {conv.unread > 0 && <div className="msg-unread">{conv.unread}</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT PANEL: CHAT FEED ── */}
        <div className="msg-right">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-left">
              <div className="chat-avatar">
                {selectedEvent?.name
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
                  <span>{selectedEvent?.name || 'Event Coordination'}</span>
                  <span
                    style={{
                      fontSize: '10px',
                      background: 'rgba(6,182,212,0.15)',
                      color: 'var(--cyan)',
                      padding: '1px 7px',
                      borderRadius: '10px',
                      fontWeight: 700,
                    }}
                  >
                    {activeTab === 'vendor' ? 'Vendor Channel' : 'Client Channel'}
                  </span>
                </div>
                <div className="chat-status">● Live Coordination Active</div>
              </div>
            </div>

            <div className="chat-header-right">
              <button
                type="button"
                className="chat-btn-new-request"
                onClick={() => setIsRequestModalOpen(true)}
                title="Create dispatch request for resources or staff"
              >
                <Plus size={14} />
                <span>New Request</span>
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="chat-messages">
            {loadingMessages && messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '40px' }}>
                Connecting to coordination feed...
              </div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '50px' }}>
                No messages yet. Send an operational message to begin coordinating.
              </div>
            ) : (
              messages.map((m, idx) => {
                const isMe =
                  (m.sender &&
                    session.name &&
                    m.sender.toLowerCase().includes(session.name.toLowerCase()));
                const isRequest =
                  m.isRequest ||
                  (m.text && m.text.startsWith('📋 Dispatch Request:')) ||
                  m.type === 'staff_request';

                return (
                  <div
                    key={m.id || idx}
                    className={`msg-bubble-wrap ${isMe ? 'me' : 'them'}`}
                  >
                    <div className="msg-sender">
                      <span>{m.sender || (isMe ? 'You' : 'Vendor Lead')}</span>
                      <span
                        className={`sender-badge ${
                          isMe
                            ? 'badge-staff'
                            : activeTab === 'client'
                            ? 'badge-client'
                            : 'badge-vendor'
                        }`}
                      >
                        {m.role || (isMe ? 'Staff' : 'Vendor')}
                      </span>
                    </div>

                    <div
                      className={`msg-bubble ${isRequest ? 'msg-bubble--request' : ''}`}
                    >
                      {m.text}
                    </div>

                    <div className="msg-time">{m.time || 'Just now'}</div>
                  </div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input Bar */}
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
              title="Attach checklist or image"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip size={16} />
            </button>

            <input
              type="text"
              className="chat-input"
              placeholder={`Message ${activeTab === 'vendor' ? 'Vendor' : 'Client'} on ${
                selectedEvent?.name || 'event'
              }...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />

            <button
              type="button"
              className="chat-emoji-btn"
              title="Add emoji"
              onClick={() => setInputText((prev) => prev + ' 👍')}
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

      {/* ── MODAL: CREATE DISPATCH REQUEST (LEGACY REQUEST MODAL) ── */}
      {isRequestModalOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target.classList.contains('modal-overlay')) setIsRequestModalOpen(false);
          }}
        >
          <div className="dispatch-modal">
            <div className="dispatch-modal__header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="dispatch-modal__icon">
                  <Boxes size={20} />
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      color: 'var(--text)',
                      margin: 0,
                    }}
                  >
                    Create Dispatch Request
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '2px' }}>
                    Ask Vendor for Resources, Equipment, or Additional Staff
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRequestModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text2)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitRequest}>
              <div className="dispatch-modal__body">
                {/* Target Event */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Target Event</label>
                  <select
                    value={reqEventId}
                    onChange={(e) => setReqEventId(e.target.value)}
                    required
                  >
                    {filteredConversations.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.status})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Request Type */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Request Category</label>
                  <select
                    value={reqType}
                    onChange={(e) => setReqType(e.target.value)}
                  >
                    <option value="resource">Equipment / Resource</option>
                    <option value="staff">Additional Staff / Backup</option>
                    <option value="technical">Technical / AV Support</option>
                    <option value="logistics">Logistics / Furniture</option>
                  </select>
                </div>

                {/* Item & Quantity */}
                <div style={{ display: 'flex', gap: '14px' }}>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label>Requested Item / Role</label>
                    <input
                      type="text"
                      placeholder="e.g. 2 XLR extensions, 4 Banquet Tables"
                      value={reqItem}
                      onChange={(e) => setReqItem(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ width: '90px', marginBottom: 0 }}>
                    <label>Quantity</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={reqQty}
                      onChange={(e) => setReqQty(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Reason / Notes */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Reason / Location on Site (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Guest count exceeded seating at West Pavilion foyer..."
                    value={reqDesc}
                    onChange={(e) => setReqDesc(e.target.value)}
                  />
                </div>
              </div>

              <div className="dispatch-modal__footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsRequestModalOpen(false)}
                  disabled={submittingRequest}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingRequest || !reqItem.trim()}
                  style={{
                    background: 'linear-gradient(135deg, var(--cyan), #0284c7)',
                    borderColor: 'var(--cyan)',
                  }}
                >
                  {submittingRequest ? 'Dispatching...' : 'Send Request to Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

