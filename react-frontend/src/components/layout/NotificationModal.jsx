import React, { useState } from 'react';

export const NotificationModal = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Corporate Gala execution sequence has initiated! Live tracking is now engaged.', time: 'Just now', icon: 'ph-rocket-launch', unread: true, link: '/client/track-progress' },
    { id: 2, text: 'Sarah Johnson sent you a direct message regarding catering selections.', time: '1 hour ago', icon: 'ph-chat-teardrop-text', unread: true, link: '/client/coordination' },
    { id: 3, text: 'A new secure invoice INV-2026-081 has been generated for review.', time: 'Yesterday', icon: 'ph-receipt', unread: true, link: '/client/billing' }
  ]);

  if (!isOpen) return null;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const markRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, unread: false } : n));
  };

  return (
    <div className="notif-modal-overlay show" onClick={onClose}>
      <div className="notif-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="n-modal-header">
          <h3><i className="ph-fill ph-bell-ringing"></i> Notifications Center</h3>
          <button className="n-btn-close" onClick={onClose}><i className="ph ph-x"></i></button>
        </div>

        <div className="n-modal-body">
          {notifications.map((item) => (
            <div
              key={item.id}
              className={`n-item ${item.unread ? 'unread' : ''}`}
              onClick={() => markRead(item.id)}
            >
              <div className="n-icon"><i className={`ph ${item.icon}`}></i></div>
              <div className="n-content">
                <div className="n-text">{item.text}</div>
                <div className="n-meta">
                  <span className="n-time"><i className="ph ph-clock"></i> {item.time}</span>
                  <span className="n-action">View details &rarr;</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="n-modal-footer">
          <button className="n-mark-read" onClick={markAllRead}>
            <i className="ph ph-checks"></i> Mark all as read
          </button>
        </div>
      </div>
    </div>
  );
};
