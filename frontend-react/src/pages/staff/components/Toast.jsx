import React from 'react';

/**
 * Toast component for staff notifications
 */
export default function Toast({ message, type = 'success' }) {
  if (!message) return null;

  const icon = type === 'success' ? '✅' : type === 'warn' ? '🔔' : '⚠️';

  return (
    <div className="staff-toast">
      <span>{icon}</span>
      <span>{message}</span>
    </div>
  );
}
