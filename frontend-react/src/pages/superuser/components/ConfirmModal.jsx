/**
 * COMPONENT: ConfirmModal.jsx
 * WHAT IT DOES:
 *   Universal modal confirmation dialog for destructive actions
 *   (deleting users, deleting events, removing resources, purging staff).
 *
 * PROPS:
 *   - isOpen: Boolean toggle controlling visibility
 *   - title: Modal headline (e.g. 'Delete User')
 *   - message: Confirmation description explaining the consequence
 *   - onConfirm: Callback function when user confirms
 *   - onClose: Callback function when user cancels or dismisses
 *   - confirmText: Label for the confirm button (defaults to 'Confirm')
 *   - isDestructive: If true, formats the confirm button in red
 */

import React from 'react';

export default function ConfirmModal({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  onConfirm,
  onClose,
  confirmText = 'Confirm',
  isDestructive = true,
}) {
  if (!isOpen) return null;

  // FACULTY MAY ASK: How do you change the keyboard escape key behavior?
  // HOW TO CHANGE: Add a useEffect listening for "keydown" and check if (e.key === 'Escape') onClose();
  return (
    <div
      className="ov open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal">
        <div className="mh">
          <span className="mt">{title}</span>
          <button className="mx" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5, marginBottom: '20px' }}>
          {message}
        </p>

        <div className="mf">
          <button className="btn btn-s" onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className={`btn ${isDestructive ? '' : 'btn-p'}`}
            style={
              isDestructive
                ? {
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: '#fff',
                    boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
                  }
                : undefined
            }
            onClick={() => {
              onConfirm();
              onClose();
            }}
            type="button"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
