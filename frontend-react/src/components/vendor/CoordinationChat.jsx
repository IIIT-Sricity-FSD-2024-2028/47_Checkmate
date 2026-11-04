import React, { useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

export default function CoordinationChat({
  messages = [],
  inputText,
  onInputChange,
  onSendMessage,
  channelTitle = 'Live Event Stream',
  channelSubtitle = 'Real-time broadcast to all assigned team members',
  currentUser = 'Sarah Williams',
}) {
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat when new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage();
  };

  return (
    <div className="ch-chat">
      {/* Header */}
      <div className="ch-chat__header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {channelTitle}
          </h4>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{channelSubtitle}</span>
        </div>

        <span className="live-indicator" style={{ marginLeft: 'auto' }}>
          <span className="live-dot" /> Connected
        </span>
      </div>

      {/* Messages Feed */}
      <div className="ch-messages">
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', margin: 'auto' }}>
            No messages sent yet. Start the conversation with your team.
          </div>
        ) : (
          messages.map((msg, index) => {
            const isSelf =
              msg.self === true ||
              (msg.sender && msg.sender.toLowerCase() === currentUser.toLowerCase());

            const isSystem = msg.system === true || msg.type === 'system';

            if (isSystem) {
              return (
                <div key={msg.id || index} className="ac-msg--system" style={{ margin: '8px auto', padding: '6px 14px' }}>
                  {msg.text}
                </div>
              );
            }

            return (
              <div
                key={msg.id || index}
                className={`ac-msg ${isSelf ? 'ac-msg--self' : 'ac-msg--other'}`}
              >
                {!isSelf && (
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--pink)', marginBottom: '3px' }}>
                    {msg.sender || 'Team Member'} {msg.role ? `(${msg.role})` : ''}
                  </div>
                )}
                <div>{msg.text}</div>
                <span className="ac-msg__time">{msg.time || 'Just now'}</span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSubmit} className="ac-input-bar">
        <input
          type="text"
          placeholder="Type message to all event participants..."
          value={inputText}
          onChange={(e) => onInputChange(e.target.value)}
        />
        <button
          type="submit"
          className="ac-send-btn"
          disabled={!inputText.trim()}
          title="Send message"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

