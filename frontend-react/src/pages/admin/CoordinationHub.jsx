import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Bell, Send, Megaphone, Briefcase, 
  Plus, RefreshCcw, CheckCircle, User, Clock, Trash2, X
} from 'lucide-react';
import { getStateKey, setStateKey } from '../../services/stateService';
import { getAuthSession } from '../../services/auth/authStorage';
import '../../styles/admin.css';

export default function CoordinationHub() {
  const session = getAuthSession();
  const adminName = session?.user?.name || session?.name || 'Aarav Mehta';

  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'announcements' | 'recruitments'
  const [messages, setMessages] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [recruitments, setRecruitments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  // Modals
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annTarget, setAnnTarget] = useState('all');

  const [showJobModal, setShowJobModal] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDepartment, setJobDepartment] = useState('Operations');
  const [jobLocation, setJobLocation] = useState('New York, NY');
  const [jobType, setJobType] = useState('Full-Time');

  const fetchHubData = async () => {
    try {
      setLoading(true);
      const [chatRes, notifRes, recruitRes] = await Promise.all([
        getStateKey('adminChatMessages').catch(() => []),
        getStateKey('vendorNotifications').catch(() => []),
        getStateKey('recruitments').catch(() => []),
      ]);
      setMessages(Array.isArray(chatRes) ? chatRes : []);
      setAnnouncements(Array.isArray(notifRes) ? notifRes : []);
      setRecruitments(Array.isArray(recruitRes) ? recruitRes : []);
    } catch (err) {
      console.error('Failed to load coordination data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHubData();
    const interval = setInterval(fetchHubData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || sending) return;

    const newMsg = {
      id: `msg_${Date.now()}`,
      sender: adminName,
      senderRole: 'Admin',
      text: text,
      timestamp: new Date().toISOString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    setInputText('');

    try {
      setSending(true);
      await setStateKey('adminChatMessages', updated);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!annTitle.trim() || !annMessage.trim()) return;

    const newAnn = {
      id: `ann_${Date.now()}`,
      title: annTitle.trim(),
      message: annMessage.trim(),
      target: annTarget,
      sender: adminName,
      date: new Date().toISOString().slice(0, 10),
    };

    const updated = [newAnn, ...announcements];
    setAnnouncements(updated);
    setShowAnnounceModal(false);
    setAnnTitle('');
    setAnnMessage('');

    try {
      await setStateKey('vendorNotifications', updated);
    } catch (err) {
      console.error('Failed to post announcement:', err);
    }
  };

  const handleCreateRecruitment = async (e) => {
    e.preventDefault();
    if (!jobTitle.trim()) return;

    const newJob = {
      id: `job_${Date.now()}`,
      title: jobTitle.trim(),
      department: jobDepartment,
      location: jobLocation,
      type: jobType,
      status: 'Open',
      postedDate: new Date().toISOString().slice(0, 10),
    };

    const updated = [newJob, ...recruitments];
    setRecruitments(updated);
    setShowJobModal(false);
    setJobTitle('');

    try {
      await setStateKey('recruitments', updated);
    } catch (err) {
      console.error('Failed to save recruitment:', err);
    }
  };

  const handleDeleteRecruitment = async (jobId) => {
    const updated = recruitments.filter((j) => j.id !== jobId);
    setRecruitments(updated);
    try {
      await setStateKey('recruitments', updated);
    } catch (err) {
      console.error('Failed to delete recruitment:', err);
    }
  };

  return (
    <div className="admin-page-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#fff', margin: 0 }}>Coordination Hub</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Multi-portal communications, team broadcast alerts, and platform job recruitment management.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {activeTab === 'announcements' && (
            <button
              onClick={() => setShowAnnounceModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 14px',
                background: '#ec4899',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              <Plus size={15} /> New Announcement
            </button>
          )}

          {activeTab === 'recruitments' && (
            <button
              onClick={() => setShowJobModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 14px',
                background: '#3b82f6',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              <Plus size={15} /> Add Job Posting
            </button>
          )}

          <button
            onClick={fetchHubData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            <RefreshCcw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Nav Tabs */}
      <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '10px', marginBottom: '20px', width: 'fit-content' }}>
        <button
          onClick={() => setActiveTab('chat')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13.5px',
            fontWeight: '600',
            cursor: 'pointer',
            background: activeTab === 'chat' ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: activeTab === 'chat' ? '#fff' : 'var(--text-muted)',
          }}
        >
          <MessageSquare size={16} /> Admin Operations Chat
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13.5px',
            fontWeight: '600',
            cursor: 'pointer',
            background: activeTab === 'announcements' ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: activeTab === 'announcements' ? '#fff' : 'var(--text-muted)',
          }}
        >
          <Megaphone size={16} /> Broadcast Alerts ({announcements.length})
        </button>

        <button
          onClick={() => setActiveTab('recruitments')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13.5px',
            fontWeight: '600',
            cursor: 'pointer',
            background: activeTab === 'recruitments' ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: activeTab === 'recruitments' ? '#fff' : 'var(--text-muted)',
          }}
        >
          <Briefcase size={16} /> Staff Recruitment ({recruitments.length})
        </button>
      </div>

      {/* Tab 1: Admin Chat */}
      {activeTab === 'chat' && (
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', height: '620px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>Operations Dispatch Log</span>
            <span style={{ fontSize: '12px', color: '#00e676', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00e676' }} /> Live Synced
            </span>
          </div>

          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {messages.length === 0 ? (
              <div style={{ margin: 'auto', color: 'var(--text-muted)', textAlign: 'center', fontSize: '13.5px' }}>
                No operations messages yet. Post an update below.
              </div>
            ) : (
              messages.map((m, idx) => {
                const isSelf = m.sender === adminName;
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: isSelf ? 'flex-end' : 'flex-start' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', gap: '6px' }}>
                      <span style={{ color: isSelf ? '#ec4899' : '#60a5fa', fontWeight: '600' }}>{m.sender}</span>
                      <span>({m.senderRole || 'Admin'})</span>
                      <span>{m.time || (m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')}</span>
                    </div>
                    <div
                      style={{
                        maxWidth: '75%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: isSelf ? 'rgba(236, 72, 153, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        border: isSelf ? '1px solid rgba(236, 72, 153, 0.3)' : '1px solid var(--border)',
                        color: '#fff',
                        fontSize: '13.5px',
                        lineHeight: '1.45',
                      }}
                    >
                      {m.text}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={handleSendMessage} style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.03)', borderTop: '1px solid var(--border)', display: 'flex', gap: '12px' }}>
            <input
              type="text"
              placeholder="Send message to admin coordination log..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 14px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '13.5px',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={sending || !inputText.trim()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 18px',
                background: '#ec4899',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '13.5px',
                fontWeight: '600',
                cursor: !inputText.trim() ? 'not-allowed' : 'pointer',
                opacity: !inputText.trim() ? 0.6 : 1,
              }}
            >
              <Send size={15} /> Send
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Broadcast Announcements */}
      {activeTab === 'announcements' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
          {announcements.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No broadcast announcements published yet.
            </div>
          ) : (
            announcements.map((ann, idx) => (
              <div key={idx} style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#ec4899', fontWeight: '600', textTransform: 'uppercase' }}>
                    Target: {ann.target || 'All Users'}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{ann.date || 'Recent'}</span>
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', margin: '0 0 8px 0' }}>{ann.title}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>{ann.message}</p>
                <div style={{ marginTop: '14px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  Published by {ann.sender || 'Platform Admin'}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Staff Recruitment */}
      {activeTab === 'recruitments' && (
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Position Role</th>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Department</th>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Location</th>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Employment Type</th>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '14px 16px', fontWeight: '600', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {recruitments.map((job) => (
                <tr key={job.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px 16px', color: '#fff', fontWeight: '600' }}>{job.title}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{job.department || 'Operations'}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{job.location || 'On-site'}</td>
                  <td style={{ padding: '14px 16px', color: '#fff' }}>{job.type || 'Full-Time'}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', background: 'rgba(0, 230, 118, 0.15)', color: '#00e676', fontWeight: '600' }}>
                      {job.status || 'Open'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleDeleteRecruitment(job.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                      title="Remove Listing"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Announcement Modal */}
      {showAnnounceModal && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(5px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px'
          }}
          onClick={() => setShowAnnounceModal(false)}
        >
          <div
            style={{
              background: '#12141c', border: '1px solid var(--border)', borderRadius: '14px',
              width: '100%', maxWidth: '500px', padding: '24px', position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: '0 0 16px 0' }}>
              Publish Broadcast Announcement
            </h2>
            <form onSubmit={handleCreateAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Headline</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scheduled Platform Maintenance"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Target Audience</label>
                <select
                  value={annTarget}
                  onChange={(e) => setAnnTarget(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', background: '#161922', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                >
                  <option value="all">All Portals (Clients, Vendors, Staff)</option>
                  <option value="vendors">Vendors Only</option>
                  <option value="staff">Staff Only</option>
                  <option value="clients">Clients Only</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Message Details</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide full announcement details..."
                  value={annMessage}
                  onChange={(e) => setAnnMessage(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '13px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAnnounceModal(false)}
                  style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '13px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', background: '#ec4899', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Publish Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Job Modal */}
      {showJobModal && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(5px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px'
          }}
          onClick={() => setShowJobModal(false)}
        >
          <div
            style={{
              background: '#12141c', border: '1px solid var(--border)', borderRadius: '14px',
              width: '100%', maxWidth: '500px', padding: '24px', position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: '0 0 16px 0' }}>
              Add Staff Recruitment Opening
            </h2>
            <form onSubmit={handleCreateRecruitment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Job Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lead Sound Engineer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Department</label>
                <select
                  value={jobDepartment}
                  onChange={(e) => setJobDepartment(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', background: '#161922', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                >
                  <option value="Operations">Operations</option>
                  <option value="Audio / Visual">Audio / Visual</option>
                  <option value="Stage Management">Stage Management</option>
                  <option value="Security & Safety">Security & Safety</option>
                  <option value="Catering Logistics">Catering Logistics</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Location</label>
                <input
                  type="text"
                  required
                  value={jobLocation}
                  onChange={(e) => setJobLocation(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Employment Type</label>
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', background: '#161922', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                >
                  <option value="Full-Time">Full-Time</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Contract / Event Basis">Contract / Event Basis</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowJobModal(false)}
                  style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '13px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', background: '#3b82f6', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Add Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

