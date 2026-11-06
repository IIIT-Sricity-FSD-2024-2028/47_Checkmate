/**
 * COMPONENT: Toast.jsx
 * WHAT IT DOES:
 *   Floating toast notification container matching vanilla UI.toast().
 *   Provides instant user feedback upon saving, deleting, or validation errors.
 *
 * PROPS:
 *   - message: Text message to display
 *   - type: 'ok' | 'info' | 'err'
 *   - onClose: Callback to clear the notification
 */

import React, { useEffect } from 'react';

export default function Toast({ message, type = 'ok', onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, 2800);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  // FACULTY MAY ASK: How do you increase or decrease the toast display duration?
  // HOW TO CHANGE: In the useEffect above, change 2800 to whatever millisecond value you prefer (e.g. 5000).
  const icon = type === 'err' ? '⚠️' : type === 'info' ? 'ℹ️' : '✓';

  return (
    <div
      className="su-toast"
      style={
        type === 'err'
          ? { borderColor: 'rgba(239, 68, 68, 0.5)' }
          : type === 'info'
          ? { borderColor: 'rgba(59, 130, 246, 0.5)' }
          : undefined
      }
    >
      <span>{icon}</span>
      <span>{message}</span>
    </div>
  );
}
