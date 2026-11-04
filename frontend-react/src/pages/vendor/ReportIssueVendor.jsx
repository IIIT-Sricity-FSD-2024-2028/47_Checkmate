import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, ShieldAlert } from 'lucide-react';
import VendorTopBar from '../../components/vendor/VendorTopBar';
import ReportIssueForm from '../../components/vendor/ReportIssueForm';
import ReportIssueTable from '../../components/vendor/ReportIssueTable';

import { getMyEvents, getMyIssues, createIssue } from '../../services';
import { getAuthUser } from '../../services/auth/authStorage';

export default function ReportIssueVendor({ target: defaultTarget = 'event' }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Mode: 'event' or 'admin'
  const [target, setTarget] = useState(() => {
    if (location.pathname.includes('report-issue-admin') || defaultTarget === 'admin') {
      return 'admin';
    }
    return 'event';
  });

  const [events, setEvents] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Resource / Equipment Defect');
  const [priority, setPriority] = useState('medium');
  const [eventId, setEventId] = useState('');
  const [description, setDescription] = useState('');

  // Current session user
  const currentUser = useMemo(() => {
    const user = getAuthUser();
    return {
      name: user?.name || 'Sarah Williams',
      email: user?.email || 'sarah@eliteevents.com',
      vendorId: user?.vendorId || 'V001',
    };
  }, []);

  // Fetch Events and Existing Issues
  const loadData = useCallback(async () => {
    try {
      const [evs, iss] = await Promise.all([
        getMyEvents().catch(() => []),
        getMyIssues().catch(() => []),
      ]);
      setEvents(evs || []);
      setIssues(iss || []);
    } catch (err) {
      console.error('Failed to load issues data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Tab switch
  const handleTabChange = (newTarget) => {
    setTarget(newTarget);
    navigate(newTarget === 'admin' ? '/vendor/report-issue-admin' : '/vendor/report-issue', { replace: true });
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setSubmitting(true);
    try {
      const selectedEvt = events.find((ev) => ev.id === eventId);
      const newIssuePayload = {
        title: title.trim(),
        category: category,
        priority: priority,
        eventId: target === 'admin' ? null : eventId || null,
        eventName: target === 'admin' ? 'Admin Platform Ticket' : selectedEvt?.name || 'General Operations',
        description: description.trim(),
        reporter: currentUser.name,
        reporterEmail: currentUser.email,
        vendorId: currentUser.vendorId,
        target: target,
        status: 'open',
        createdAt: new Date().toISOString(),
      };

      const created = await createIssue(newIssuePayload);

      // Optimistic update
      setIssues((prev) => [created || { ...newIssuePayload, id: `ISS_${Date.now()}` }, ...prev]);

      // Reset form
      setTitle('');
      setDescription('');
      setEventId('');

      setToastMessage({
        type: 'success',
        text: `Incident ticket submitted successfully! Ticket ID #${created?.id || 'NEW'} registered.`,
      });
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('Failed to submit issue ticket:', err);
      setToastMessage({
        type: 'error',
        text: err.message || 'Failed to submit incident ticket. Please check connection.',
      });
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="vendor-dashboard">
      <VendorTopBar
        title={target === 'admin' ? 'Report Issue to Admin' : 'Report Issue on Event'}
      />

      <div className="content" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Toast Notification */}
        {toastMessage && (
          <div
            style={{
              padding: '12px 18px',
              borderRadius: '8px',
              fontSize: '13.5px',
              fontWeight: 500,
              background: toastMessage.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
              border: `1px solid ${toastMessage.type === 'success' ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
              color: toastMessage.type === 'success' ? '#86efac' : '#fca5a5',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              animation: 'fadeUpVendor 0.25s ease-out',
            }}
          >
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Section Tabs */}
        <div className="ch-section-tabs">
          <button
            type="button"
            className={`ch-section-tab ${target === 'event' ? 'active' : ''}`}
            onClick={() => handleTabChange('event')}
          >
            <AlertCircle size={16} />
            <span>Issue on Event</span>
          </button>

          <button
            type="button"
            className={`ch-section-tab ${target === 'admin' ? 'active' : ''}`}
            onClick={() => handleTabChange('admin')}
          >
            <ShieldAlert size={16} />
            <span>Issue to Admin</span>
          </button>
        </div>

        {/* Form Container */}
        <div className="ri-wrapper">
          <ReportIssueForm
            target={target}
            events={events}
            title={title}
            setTitle={setTitle}
            category={category}
            setCategory={setCategory}
            priority={priority}
            setPriority={setPriority}
            eventId={eventId}
            setEventId={setEventId}
            description={description}
            setDescription={setDescription}
            reporterName={currentUser.name}
            reporterEmail={currentUser.email}
            onSubmit={handleSubmit}
            isSubmitting={submitting}
          />
        </div>

        {/* Historical Tickets Table */}
        <ReportIssueTable issues={issues} onRefresh={loadData} />
      </div>
    </div>
  );
}

