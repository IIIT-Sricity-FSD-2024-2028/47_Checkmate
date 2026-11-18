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
     - GET  /api/admin-chat : this staff member's conversation (hooks/useLiveChat.js)
     - POST /api/admin-chat : send one message
     New messages arrive live through the socket; the page polls every 3 seconds
     only while the socket is down.
============================================================ */

import React, { useState, useEffect, useRef } from 'react';
import '../../styles/staff.css';
import { getSessionUser } from '../../services/staffApi';
import useLiveChat, { formatMessageTime } from '../../hooks/useLiveChat';

// "2026-05-01T10:15:00Z" -> "10:15 AM" today, "1 May, 10:15 AM" otherwise
const timeStr = formatMessageTime;

export default function StaffMessagesAdmin() {
  // Signed-in staff member (name, email, role) read once from the session
  const [session] = useState(() => getSessionUser());

  // This staff member's conversation with the admin team, delivered live
  const chat = useLiveChat({ kind: 'admin' });
  const messages = chat.messages;

  // Text in the message box
  const [inputText, setInputText] = useState('');

  // Error shown above the input when loading or sending fails
  const [error, setError] = useState('');

  // True while a message is being saved, to stop double sends
  const [sending, setSending] = useState(false);

  // The scrolling message area, so we can keep the newest message in view
  const messagesRef = useRef(null);

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

    setSending(true);
    const ok = await chat.send(text);
    if (ok) {
      setInputText('');
      setError('');
    } else {
      setError('Message not sent. Please try again.');
    }
    setSending(false);
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
