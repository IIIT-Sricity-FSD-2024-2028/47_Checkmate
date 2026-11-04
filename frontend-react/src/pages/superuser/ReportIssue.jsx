import React, { useState, useEffect } from 'react';
import { 
  Bug, AlertTriangle, Send, CheckCircle2, RefreshCcw, 
  Calendar, ShieldAlert, Clock, Eye
} from 'lucide-react';
import { getEvents } from '../../services/eventService';
import { createIssue, getIssues } from '../../services/issueService';
import { getAuthSession } from '../../services/auth/authStorage';
import '../../styles/superuser.css';

export default function SuperuserReportIssue() {
  const session = getAuthSession();
  const userName = session?.user?.name || session?.name || 'Nina Patel';
  const userEmail = session?.user?.email || session?.email || 'nina.ops@checkmate.com';

  const [events, setEvents] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Infrastructure');
  const [priority, setPriority] = useState('High');
  const [eventId, setEventId] = useState('');
  const [description, setDescription] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [evts, iss] = await Promise.all([
        getEvents().catch(() => []),
        getIssues().catch(() => []),
      ]);
      setEvents(Array.isArray(evts) ? evts : []);
      setIssues(Array.isArray(iss) ? iss : []);
    } catch (err) {
      console.error('Failed to load events/issues:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    try {
      setSubmitting(true);
      const payload = {
        title: title.trim(),
        category: category,
        priority: priority,
        description: description.trim(),
        desc: description.trim(),
        reporter: userName,
        reporterRole: 'Superuser',
        email: userEmail,
        role: 'Superuser',
        status: 'open',
        event: eventId || undefined,
        eventId: eventId || undefined,
        createdAt: new Date().toISOString(),
      };

      await createIssue(payload);
      setSuccess(true);
      setTitle('');
      setDescription('');
      setEventId('');
      await fetchData();
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to file issue:', err);
      alert('Failed to report incident.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="su-page-container" style={{ maxWidth: '1000px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#fff', margin: 0 }}>Incident Escalation</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
          File emergency operational incidents, vendor breaches, or hardware infrastructure alerts.
        </p>
      </div>

      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0, 230, 118, 0.15)', border: '1px solid rgba(0, 230, 118, 0.3)', padding: '12px 16px', borderRadius: '10px', color: '#00e676', fontSize: '13.5px', marginBottom: '20px' }}>
          <CheckCircle2 size={18} /> Root incident report registered and dispatched to on-call admin!
        </div>
      )}

      {/* Report Form */}
      <div className="su-card" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={18} color="#ec4899" /> Incident Details
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Incident Headline</label>
            <input
              type="text"
              required
              placeholder="e.g. Primary power distributor failed at Convention Center"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '13.5px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', background: '#161922', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '13.5px' }}
              >
                <option value="Infrastructure">Infrastructure</option>
                <option value="Security">Security & Safety</option>
                <option value="Vendor Dispute">Vendor Dispute</option>
                <option value="Equipment Failure">Equipment Failure</option>
                <option value="Payment / Escrow">Payment / Escrow</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Severity / Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', background: '#161922', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '13.5px' }}
              >
                <option value="Critical">Critical (P0)</option>
                <option value="High">High (P1)</option>
                <option value="Medium">Medium (P2)</option>
                <option value="Low">Low (P3)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Associated Event (Optional)</label>
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', background: '#161922', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '13.5px' }}
              >
                <option value="">None / Platform-wide</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.id} — {ev.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Detailed Diagnostic Description</label>
            <textarea
              required
              rows={4}
              placeholder="Provide exact error codes, hardware models, or vendor circumstances..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '13.5px', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: '#ec4899',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '600',
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              <Send size={15} /> {submitting ? 'Escalating...' : 'Dispatch Incident Alert'}
            </button>
          </div>
        </form>
      </div>

      {/* Incident History Feed */}
      <div className="su-card">
        <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} color="#60a5fa" /> Platform Incident History
        </h2>

        {issues.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            No unresolved incidents.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {issues.slice(0, 5).map((iss) => (
              <div key={iss.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div>
                  <div style={{ color: '#fff', fontWeight: '600', fontSize: '13.5px' }}>{iss.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{iss.category || 'General'} • {iss.eventId || 'Platform'} • Reported by {iss.reporter || 'Superuser'}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`su-badge ${(iss.priority || '').toLowerCase() === 'high' || (iss.priority || '').toLowerCase() === 'critical' ? 'su-badge-red' : 'su-badge-orange'}`}>
                    {iss.priority || 'Medium'}
                  </span>
                  <span className="su-badge su-badge-blue">
                    {iss.status || 'open'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
