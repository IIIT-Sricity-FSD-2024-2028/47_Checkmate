/* ============================================================
   PAGE: Staff Admin Coordination (MessagesAdmin.jsx)
   CONVERTED FROM: front-end/pages/staff/MessagesAdmin.html
   PURPOSE: One-to-one support chat between the signed-in staff member
            and the platform administrators ("Admin Support").
            Like the HTML page, the conversation list and the
            "+ New Request" button are hidden: only the chat pane shows.
   WHAT IS SHOWN:
     - Messages this staff member sent, or that were addressed to them
       (recipientEmail), oldest first.
     - "issue-report" messages (posted by Report Issue to Admin) are shown
       as centred orange system notes, exactly like the HTML page.
   API ENDPOINTS USED (through services/staffApi.js):
     - GET /api/state/adminChatMessages : load the chat (every 3 seconds)
     - PUT /api/state/adminChatMessages : save the chat with a new message
============================================================ */

import React, { useState, useEffect, useRef } from 'react';
import '../../styles/staff.css';
import { getSessionUser, fetchAdminChat, postAdminChatMessage } from '../../services/staffApi';

// The HTML page re-read the chat every 3 seconds
const POLL_INTERVAL_MS = 3000;

// "2026-05-01T10:15:00Z" -> "10:15 AM"; empty text if unreadable
function timeStr(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function StaffMessagesAdmin() {
  // Signed-in staff member (name, email, role) read once from the session
  const [session] = useState(() => getSessionUser());

  // Every message in the shared admin chat list (filtered below)
  const [messages, setMessages] = useState([]);

  // Text in the message box
  const [inputText, setInputText] = useState('');

  // Error shown above the input when loading or sending fails
  const [error, setError] = useState('');

  // True while a message is being saved, to stop double sends
  const [sending, setSending] = useState(false);

  // The scrolling message area, so we can keep the newest message in view
  const messagesRef = useRef(null);

  // Load the chat now and then every 3 seconds, like the HTML page
  useEffect(() => {
    let isMounted = true;

    async function loadChat() {
      try {
        const list = await fetchAdminChat();
        if (isMounted) {
          setMessages(list);
          setError('');
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      }
    }

    loadChat();
    const timer = setInterval(loadChat, POLL_INTERVAL_MS);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  // Only this staff member's conversation, oldest first (same filter as the HTML page)
  const myEmail = String(session.email || '').toLowerCase();
  const myMessages = messages
    .filter((m) => {
      const sender = String(m.senderEmail || '').toLowerCase();
      const recipient = String(m.recipientEmail || '').toLowerCase();
      return sender === myEmail || recipient === myEmail;
    })
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  // Scroll to the bottom whenever the number of messages changes
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [myMessages.length]);

  // Sends the typed message (button click or Enter key)
  async function sendMsg() {
    const text = inputText.trim();
    if (!text || sending) return;

    const newMessage = {
      id: 'msg_' + Date.now(),
      sender: session.name,
      senderRole: session.role || 'Staff',
      senderEmail: session.email,
      text,
      timestamp: new Date().toISOString(),
      type: 'message',
    };

    setSending(true);
    try {
      const updated = await postAdminChatMessage(newMessage);
      setMessages(updated);
      setInputText('');
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="staff-page-container" style={{ paddingBottom: '20px' }}>
      <div className="page-title">Admin Coordination</div>
      <div className="page-sub">Chat directly with platform administrators</div>

      {/* The HTML page hides the conversation list, so the chat takes the full width */}
      <div className="msg-shell msg-shell--single">
        <div className="msg-right" style={{ flex: 1 }}>
          {/* Chat header: fixed "Admin Support" contact */}
          <div className="chat-header">
            <div className="chat-header-left">
              <div className="chat-avatar">
                A<div className="online-dot" />
              </div>
              <div>
                <div className="chat-name">
                  Admin Support <span className="chat-role-tag">Platform</span>
                </div>
                <div className="chat-status">● Online</div>
              </div>
            </div>
            <div className="chat-header-right">
              <button type="button" className="chat-kebab" title="More options">⋮</button>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-messages" id="chat-messages" ref={messagesRef}>
            {myMessages.length === 0 && (
              <div className="chat-empty">No messages yet. Start the conversation!</div>
            )}
            {myMessages.map((m) => {
              // Issue reports are shown as a centred orange note
              if (m.type === 'issue-report') {
                return (
                  <div key={m.id} className="chat-system-note">
                    {m.text}
                    <div className="chat-system-note__time">{timeStr(m.timestamp)}</div>
                  </div>
                );
              }
              const isMe = String(m.senderEmail || '').toLowerCase() === myEmail;
              return (
                <div key={m.id} className={`chat-msg ${isMe ? 'msg-self' : 'msg-other'}`}>
                  <div className="msg-bubble">{m.text}</div>
                  <div className="msg-time">{timeStr(m.timestamp)}</div>
                </div>
              );
            })}
          </div>

          {error && <div className="chat-error">{error}</div>}

          {/* Input bar */}
          <div className="chat-input-bar">
            <button type="button" className="chat-attach-btn" title="Attach file">📎</button>
            <input
              className="chat-input"
              id="msg-input"
              type="text"
              placeholder="Type your message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') sendMsg();
              }}
            />
            <button type="button" className="chat-emoji-btn">😊</button>
            <button type="button" className="chat-send-btn" onClick={sendMsg} disabled={sending} title="Send">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
