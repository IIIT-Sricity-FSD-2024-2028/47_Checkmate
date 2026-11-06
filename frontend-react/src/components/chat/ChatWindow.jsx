/**
 * ============================================================================
 * CHAT WINDOW (ChatWindow.jsx)
 * ============================================================================
 * Role: Conversation Panel (shared by Client Messages + Vendor Event Coordination)
 * Location: src/components/chat/ChatWindow.jsx
 *
 * Purpose:
 *   Right column of Messages:
 *     1. Header – who you're talking to + "Online • <event>".
 *     2. Message list – own messages on the right in pink, others on the left
 *        with name + role, issues as red system lines with "View Report".
 *        Always scrolls to the newest message.
 *     3. Input – Enter or the send button posts the message.
 *
 * Props:
 *   @param {string} title - Header name
 *   @param {string} subtitle - Header line after "Online"
 *   @param {boolean} showOnline - Show the green online line
 *   @param {Array} messages - Messages to display
 *   @param {string} emptyText - Shown when there are no messages
 *   @param {Function} isMine - (message) => true when the current user sent it
 *   @param {Function} onViewIssue - Opens the issue popup (event chat only)
 *   @param {boolean} disabled - Disables the input (no event selected)
 *   @param {Function} onSend - async (text) => true/false
 * ============================================================================
 */

import React, { useEffect, useRef, useState } from "react";
import { AlertTriangle, Send } from "lucide-react";
import { formatClock, initials } from "../../utils/clientHelpers";

// One chat bubble. Our own messages sit on the right in pink.
function Bubble({ message, mine }) {
  return (
    <div className={`cl-msg ${mine ? "mine" : ""}`}>
      {!mine && <div className="cl-avatar cl-avatar--sm">{message.senderInitials || initials(message.sender)}</div>}
      <div>
        {!mine && (
          <div className="cl-msg__sender"><strong>{message.sender}</strong> <span>{message.senderRole}</span></div>
        )}
        <div className="cl-msg__bubble">{message.text}</div>
        <div className="cl-msg__time">{formatClock(message.createdAt || message.timestamp)}</div>
      </div>
      {mine && <div className="cl-avatar cl-avatar--sm cl-avatar--pink">{initials(message.sender)}</div>}
    </div>
  );
}

// Red centred line used for issues / issue reports
function SystemMessage({ message, onView }) {
  return (
    <div className="cl-sys-msg">
      <AlertTriangle size={13} />
      <span>{message.text}</span>
      {onView && message.issueId && <button type="button" onClick={() => onView(message.issueId)}>View Report</button>}
      <span className="cl-msg__time">{formatClock(message.createdAt || message.timestamp)}</span>
    </div>
  );
}

const SYSTEM_TYPES = ["issue", "contingency", "issue-report"];

function ChatWindow({ title, subtitle, showOnline, messages = [], emptyText, isMine, onViewIssue, disabled, onSend }) {
  const [draft, setDraft] = useState("");

  // FACULTY MAY ASK: What is useRef for here?
  // HOW TO CHANGE: It gives us the real chat-box <div>, so we can set its scrollTop
  // to the bottom whenever a message arrives. Changing a ref doesn't re-render.
  const boxRef = useRef(null);
  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [messages.length, title]);

  const send = async () => {
    const text = draft.trim();
    if (!text || disabled) return;
    setDraft("");
    const ok = await onSend(text);
    if (!ok) setDraft(text); // give the text back so nothing is lost
  };

  return (
    <section className="cl-chat-main">
      {/* ── Header ── */}
      <div className="cl-chat-header">
        <div className="cl-avatar">{initials(title)}</div>
        <div>
          <h4>{title}</h4>
          {showOnline && (
            <p className="cl-chat-online"><span className="cl-online-dot" /> Online{subtitle ? ` • ${subtitle}` : ""}</p>
          )}
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="cl-chat-messages" ref={boxRef}>
        {messages.length === 0 && <div className="cl-client-muted">{emptyText}</div>}
        {messages.map((m) =>
          SYSTEM_TYPES.includes(m.type)
            ? <SystemMessage key={m.id} message={m} onView={onViewIssue} />
            : <Bubble key={m.id} message={m} mine={isMine(m)} />
        )}
      </div>

      {/* ── Input ── */}
      <div className="cl-chat-input">
        <input type="text" placeholder="Type a message..." autoComplete="off" value={draft} disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }} />
        <button type="button" className="cl-chat-send" onClick={send} aria-label="Send"><Send size={18} /></button>
      </div>
    </section>
  );
}

export default ChatWindow;
