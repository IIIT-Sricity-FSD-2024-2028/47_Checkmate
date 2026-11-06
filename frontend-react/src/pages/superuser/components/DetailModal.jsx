/**
 * COMPONENT: DetailModal.jsx
 * WHAT IT DOES:
 *   Modal window for inspecting full record details in an organized 2-column grid.
 *   Replaces vanilla store's UI.viewDetail() helper.
 *
 * PROPS:
 *   - isOpen: Boolean visibility flag
 *   - title: Modal headline (e.g. 'Event Details', 'Booking Details')
 *   - fields: Array of key-value pairs [[ 'Client', 'Jane Doe' ], [ 'Cost', '$25,000' ]]
 *   - onClose: Callback function when closing the modal
 */

import React from 'react';

export default function DetailModal({
  isOpen,
  title = 'Details',
  fields = [],
  onClose,
}) {
  if (!isOpen) return null;

  // FACULTY MAY ASK: How do you add an export or print button to this details modal?
  // HOW TO CHANGE: Inside the ".mf" footer below, add a new <button className="btn btn-p" onClick={() => window.print()}>Print</button>.
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

        <div className="view-detail-grid">
          {fields.map(([k, v], idx) => (
            <div key={idx} className="view-detail-card">
              <div className="view-detail-label">{k}</div>
              <div className="view-detail-val">
                {typeof v === 'string' || typeof v === 'number' ? v : v}
              </div>
            </div>
          ))}
        </div>

        <div className="mf">
          <button className="btn btn-s" onClick={onClose} type="button">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
