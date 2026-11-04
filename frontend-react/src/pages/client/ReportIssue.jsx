/**
 * ============================================================================
 * CLIENT REPORT ISSUE (ReportIssue.jsx)
 * ============================================================================
 * Role: Client Portal
 * Location: src/pages/client/ReportIssue.jsx
 *
 * Purpose:
 *   Submit operational, venue, or service issues directly to Event Coordinators & Admin:
 *     - Fetches client's live events to populate the related event selector
 *     - Controlled form: Title, Description, Priority, Event selector, Reporter metadata
 *     - Submits payload to POST /api/issues with reporterRole: 'Client'
 *     - Instant toast feedback and redirect
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Send,
  ArrowLeft,
  Building2,
  ShieldAlert,
} from 'lucide-react';

import '../../styles/client.css';
import { getAuthSession, getAuthUser } from '../../services/auth/authStorage';
import { getMyEvents } from '../../services/eventService';
import { createIssue } from '../../services/issueService';

export default function ClientReportIssue() {
  const navigate = useNavigate();
  const session = getAuthSession();
  const user = getAuthUser() || session?.user || {};
  const clientName = user?.name || session?.name || 'Emily Carter';
  const clientEmail = user?.email || session?.email || 'emily.client@example.com';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [events, setEvents] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [error, setError] = useState(null);

  // Load client's events
  useEffect(() => {
    async function loadEvents() {
      try {
        const evts = await getMyEvents();
        if (Array.isArray(evts)) {
          setEvents(evts);
          if (evts.length > 0) {
            setSelectedEventId(evts[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load events for issue reporting:', err);
      }
    }
    loadEvents();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a brief headline for the issue.');
      return;
    }
    if (!description.trim()) {
      setError('Please provide a detailed description of the issue.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const targetEvt = events.find((ev) => ev.id === selectedEventId);

      const payload = {
        title: title.trim(),
        description: description.trim(),
        desc: description.trim(),
        priority: priority,
        event: selectedEventId || undefined,
        eventId: selectedEventId || undefined,
        reporter: clientName,
        reporterRole: 'Client',
        email: clientEmail,
        role: 'Client',
        status: 'open',
        category: 'Client Support',
        createdAt: new Date().toISOString(),
      };

      await createIssue(payload);

      setToastMessage('Issue submitted successfully! Coordinators have been alerted.');
      setTitle('');
      setDescription('');

      setTimeout(() => {
        setToastMessage(null);
        navigate('/client/dashboard');
      }, 2500);
    } catch (err) {
      setError(`Failed to submit issue: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="client-content-wrap" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid #22c55e',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '10px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 9999,
          }}
        >
          <CheckCircle2 size={18} color="#22c55e" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Report an Issue
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
          Submit details about any technical, venue, scheduling, or vendor service issues.
        </p>
      </div>

      <div className="card">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px',
            paddingBottom: '20px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(233,30,140,0.12)',
              border: '1px solid rgba(233,30,140,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--pink)',
            }}
          >
            <ShieldAlert size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
              Operational Ticket Dispatch
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              Our team reviews high-priority items within minutes during live event windows.
            </p>
          </div>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#fca5a5',
              marginBottom: '20px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group mb-4">
            <label>Issue Headline / Summary *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Additional seating needed at Ballroom Foyer entrance"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group mb-4">
            <label>Detailed Description & Reproduction *</label>
            <textarea
              className="form-control"
              rows={5}
              placeholder="Explain what occurred, the exact location on-site, and what assistance is needed..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div className="form-group">
              <label>Priority Level</label>
              <select
                className="form-control"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="Critical">🔴 Critical (Immediate Attention)</option>
                <option value="High">🟠 High (Urgent)</option>
                <option value="Medium">🟡 Medium (Normal)</option>
                <option value="Low">🟢 Low (Minor Inquiry)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Related Event</label>
              <select
                className="form-control"
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
              >
                {events.length === 0 ? (
                  <option value="">No Active Events Found</option>
                ) : (
                  events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name} ({ev.id})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Reporter Information Box */}
          <div
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '16px',
              marginBottom: '24px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px' }}>
              Reporter Profile
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', fontSize: '13px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Name:</span>{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{clientName}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Role:</span>{' '}
                <span className="status-badge" style={{ fontSize: '11px' }}>Client</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Email:</span>{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{clientEmail}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/client/dashboard')}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !title.trim()}
              style={{ background: 'linear-gradient(135deg, var(--pink), #db2777)' }}
            >
              <Send size={14} style={{ marginRight: '6px' }} />
              {submitting ? 'Submitting Issue...' : 'Submit Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
