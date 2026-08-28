import React from 'react';

// ── Button Component ──────────────────────────────────────
export const Button = ({ children, variant = 'primary', size = 'medium', className = '', onClick, disabled, type = 'button', icon, ...props }) => {
  const baseStyle = 'btn-common inline-flex items-center justify-center font-medium transition-all rounded-lg cursor-pointer';
  let variantClass = 'btn-primary';
  if (variant === 'secondary') variantClass = 'btn-secondary';
  if (variant === 'outline') variantClass = 'btn-outline';
  if (variant === 'danger') variantClass = 'btn-danger';
  if (variant === 'clean') variantClass = 'action-btn-clean';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variantClass} ${className}`}
      {...props}
    >
      {icon && <span className="mr-2 inline-flex items-center">{icon}</span>}
      {children}
    </button>
  );
};

// ── Input Component ───────────────────────────────────────
export const Input = ({ label, id, type = 'text', value, onChange, placeholder, required = false, error, className = '', ...props }) => {
  return (
    <div className={`form-group ${className}`} style={{ marginBottom: '16px' }}>
      {label && (
        <label htmlFor={id} style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-secondary, #94a3b8)' }}>
          {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="form-control"
        style={{
          width: '100%',
          padding: '10px 14px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: error ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          color: '#fff',
          fontSize: '14px',
          outline: 'none',
          boxSizing: 'border-box'
        }}
        {...props}
      />
      {error && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{error}</span>}
    </div>
  );
};

// ── Card Component ────────────────────────────────────────
export const Card = ({ children, title, subtitle, icon, className = '', style = {}, headerAction }) => {
  return (
    <div
      className={`card ${className}`}
      style={{
        background: 'var(--bg-sidebar, #111827)',
        border: '1px solid var(--border, rgba(255, 255, 255, 0.1))',
        borderRadius: '12px',
        padding: '20px',
        boxSizing: 'border-box',
        ...style
      }}
    >
      {(title || icon) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {icon && <span style={{ fontSize: '20px', color: 'var(--pink, #ec4899)' }}>{icon}</span>}
            <div>
              {title && <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#fff' }}>{title}</h3>}
              {subtitle && <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>{subtitle}</p>}
            </div>
          </div>
          {headerAction}
        </div>
      )}
      {children}
    </div>
  );
};

// ── Modal Component ───────────────────────────────────────
export const Modal = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay show"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(6, 10, 20, 0.8)',
        backdropFilter: 'blur(10px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-sidebar, #0f172a)',
          border: '1px solid rgba(233, 30, 140, 0.3)',
          borderRadius: '16px',
          width: '90%',
          maxWidth: '540px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(90deg, rgba(233,30,140,0.1) 0%, transparent 100%)'
          }}
        >
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#fff' }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            &times;
          </button>
        </div>
        <div style={{ padding: '24px', overflowY: 'auto' }}>{children}</div>
        {footer && (
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(0,0,0,0.2)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Table Component ───────────────────────────────────────
export const Table = ({ headers = [], children }) => {
  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted, #94a3b8)', fontSize: '12px', textTransform: 'uppercase' }}>
            {headers.map((h, i) => (
              <th key={i} style={{ padding: '12px 16px', fontWeight: 600 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
};

// ── Loading & Error ───────────────────────────────────────
export const LoadingSpinner = ({ message = 'Loading...' }) => (
  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary, #94a3b8)' }}>
    <div className="spinner" style={{ display: 'inline-block', width: '28px', height: '28px', border: '3px solid rgba(233,30,140,0.2)', borderTopColor: '#ec4899', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '12px' }}></div>
    <div>{message}</div>
  </div>
);

export const ErrorMessage = ({ message }) => (
  <div style={{ padding: '14px 18px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#f87171', fontSize: '14px', margin: '16px 0' }}>
    <i className="ph ph-warning-circle" style={{ marginRight: '8px' }}></i>
    {message}
  </div>
);

// ── Domain Specific Cards ─────────────────────────────────
export const TaskCard = ({ task, onStatusChange }) => (
  <Card title={task.title || task.name} subtitle={`Priority: ${task.priority || 'Medium'}`}>
    <p style={{ fontSize: '13px', color: '#94a3b8', margin: '8px 0' }}>{task.description || task.desc}</p>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
      <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px', background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>{task.status}</span>
      {onStatusChange && (
        <button onClick={() => onStatusChange(task.id)} style={{ fontSize: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer' }}>
          Update Status
        </button>
      )}
    </div>
  </Card>
);

export const ResourceCard = ({ resource, onAllocate }) => (
  <Card title={resource.name} subtitle={`Category: ${resource.category || resource.cat}`}>
    <div style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '10px' }}>
      <div>Available: {resource.avail ?? resource.quantity ?? 0} / {resource.total ?? resource.quantity ?? 0}</div>
      <div>Price: ${resource.price} / {resource.unit || 'day'}</div>
    </div>
    {onAllocate && (
      <Button variant="primary" size="small" onClick={() => onAllocate(resource)}>
        Allocate Resource
      </Button>
    )}
  </Card>
);

export const VolunteerCard = ({ volunteer, onAssign }) => (
  <Card title={volunteer.name} subtitle={volunteer.role || 'Staff / Volunteer'}>
    <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '10px' }}>
      <div>Phone: {volunteer.phone || 'N/A'}</div>
      <div>Email: {volunteer.email}</div>
    </div>
    {onAssign && <Button variant="outline" onClick={() => onAssign(volunteer)}>Assign Task</Button>}
  </Card>
);

export const DonationCard = ({ donation }) => (
  <Card title={donation.title || 'Support Event'} subtitle={`Amount: $${donation.amount || 0}`}>
    <p style={{ fontSize: '13px', color: '#94a3b8' }}>{donation.notes || 'Thank you for supporting this event.'}</p>
  </Card>
);

export const RequestCard = ({ request, onApprove, onReject }) => (
  <Card title={request.name || request.title} subtitle={`Client: ${request.client || request.createdBy}`}>
    <p style={{ fontSize: '13px', color: '#94a3b8', margin: '8px 0' }}>{request.notes || request.desc || 'Event Request Submission'}</p>
    <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
      {onApprove && <Button variant="primary" onClick={() => onApprove(request.id)}>Approve</Button>}
      {onReject && <Button variant="danger" onClick={() => onReject(request.id)}>Reject</Button>}
    </div>
  </Card>
);
