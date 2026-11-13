import React from 'react';
import { ClipboardCheck, Check, X, Clock } from 'lucide-react';

export default function MonitoringStaffRequests({ requests = [], onApprove, onReject }) {
  return (
    <div className="mon-requests">
      <div className="mon-requests__header">
        <ClipboardCheck size={16} className="text-cyan" />
        <h4>On-Site Staff Requests</h4>
        {requests.length > 0 && (
          <span className="mon-counter-badge">{requests.length} Pending</span>
        )}
      </div>

      <div className="mon-requests__list">
        {requests.length === 0 ? (
          <div className="mon-empty-sub">No pending requests from on-site personnel.</div>
        ) : (
          requests.map((req) => (
            <div key={req.id} className="mon-request-item">
              <div className="mon-request-item__details">
                <div className="mon-request-item__name">
                  <span>{req.staffName}</span>
                  <span className="mon-staff-role-pill">{req.role || 'Staff'}</span>
                </div>
                <div className="mon-request-item__desc">{req.requestText || req.text}</div>
                <div className="mon-request-item__time">
                  <Clock size={11} style={{ display: 'inline', marginRight: '3px' }} />
                  {req.time || 'Just now'}
                </div>
              </div>

              <div className="mon-request-item__actions">
                <button
                  type="button"
                  className="mon-req-action-btn mon-req-action-btn--approve"
                  onClick={() => onApprove(req.id)}
                  title="Approve staff request"
                >
                  <Check size={14} />
                  <span>Approve</span>
                </button>
                <button
                  type="button"
                  className="mon-req-action-btn mon-req-action-btn--reject"
                  onClick={() => onReject(req.id)}
                  title="Decline staff request"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

