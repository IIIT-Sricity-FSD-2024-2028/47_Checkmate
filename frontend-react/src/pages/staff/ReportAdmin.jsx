/* ============================================================
   PAGE: Staff Report Issue to Admin (ReportAdmin.jsx)
   CONVERTED FROM: front-end/pages/staff/ReportAdmin.html
   PURPOSE: Lets a staff member raise a platform problem (bug, payment,
            account, feature request) directly with the administrators.
            Unlike "Issue on Event" (ReportIssue.jsx) there is no related
            event: the ticket is addressed to the admin (target: 'admin').
   WHAT SUBMIT DOES (same as the HTML page):
     1. Saves the ticket with target 'admin' so it appears in the admin's
        Issue Tracking page.
     2. Posts an "Issue Reported" note into the admin coordination chat so
        it also shows on the staff Admin Coordination page.
     3. Shows a green toast and clears the form.
   FIXED vs HTML: the HTML Cancel button threw an error (it used a variable
   from another function) and never cleared the form; here it does.
   API ENDPOINTS USED (through services/staffApi.js):
     - POST /api/issues                  : create the admin ticket
     - GET/PUT /api/state/adminChatMessages : add the chat note
============================================================ */

import React, { useState } from 'react';
import { AlertCircle, Bell, CheckCircle, ChevronDown } from 'lucide-react';
import '../../styles/staff.css';
import { getSessionUser, createIssue, postAdminChatMessage } from '../../services/staffApi';

// Dropdown choices copied from the HTML page
const PRIORITIES = [
  { value: 'Critical', label: '🔴 Critical' },
  { value: 'High', label: '🟠 High' },
  { value: 'Medium', label: '🟡 Medium' },
  { value: 'Low', label: '🟢 Low' },
];
const CATEGORIES = ['Platform Bug', 'Payment Issue', 'Account Problem', 'Feature Request', 'Other'];

// The blank form, used at the start and after Submit / Cancel
const EMPTY_FORM = { title: '', description: '', priority: '', category: '' };

export default function StaffReportAdmin() {
  // Reporter details shown read-only in the "Reporter Information" box
  const [session] = useState(() => getSessionUser());

  // The four form fields, kept together in one object
  const [form, setForm] = useState(EMPTY_FORM);

  // Message shown when a required field is empty or the request fails
  const [error, setError] = useState('');

  // True while the ticket is being saved (disables the Submit button)
  const [submitting, setSubmitting] = useState(false);

  // Shows the green "Issue submitted successfully!" toast
  const [showToast, setShowToast] = useState(false);

  // Updates one field and hides the error as soon as the user types
  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    if (error) setError('');
  }

  // Validates, saves the ticket, posts the chat note, then resets the form
  async function handleSubmit() {
    const title = form.title.trim();
    const description = form.description.trim();

    // Same rule as the HTML page: every field is required
    if (!title || !description || !form.priority || !form.category) {
      setError('Please fill out all fields.');
      return;
    }

    setSubmitting(true);
    try {
      await createIssue({
        target: 'admin',
        title,
        description,
        priority: form.priority,
        category: form.category,
        status: 'Open',
        reporter: session.name,
        reporterRole: session.role || 'Staff',
        role: session.role || 'Staff',
        email: session.email,
        createdAt: new Date().toISOString(),
      });

      // The chat note is a convenience; the ticket is already saved if this fails
      try {
        await postAdminChatMessage({
          id: 'msg_' + Date.now(),
          sender: session.name,
          senderRole: session.role || 'Staff',
          senderEmail: session.email,
          text: `📋 Issue Reported: ${title} | Priority: ${form.priority} | Category: ${form.category}`,
          timestamp: new Date().toISOString(),
          type: 'issue-report',
        });
      } catch (chatErr) {
        console.error('Ticket saved, but the chat note failed:', chatErr);
      }

      setForm(EMPTY_FORM);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      setError(err.message || 'Could not submit the issue. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // Clears the form (the HTML Cancel button was meant to do this)
  function handleCancel() {
    setForm(EMPTY_FORM);
    setError('');
  }

  return (
    <div className="staff-page-container ri-admin-page">
      {/* Top bar: page title and bell, as on the HTML page */}
      <header className="topbar">
        <h1 className="page-title">Report Issue to Admin</h1>
        <div className="topbar__right">
          <button type="button" className="notif-btn" title="Notifications">
            <Bell size={18} />
            <span className="notif-badge">1</span>
          </button>
        </div>
      </header>

      <div className="content">
        <div className="ri-wrapper">
          <div className="ri-card">
            {/* Card header */}
            <div className="ri-card__header">
              <div className="ri-header-icon">
                <AlertCircle size={20} />
              </div>
              <div className="ri-header-text">
                <h3>Report Issue to Admin</h3>
                <p>Help us resolve issues quickly by providing detailed information</p>
              </div>
            </div>

            {/* Form body */}
            <div className="ri-body">
              {error && <div className="ri-error">{error}</div>}

              <div className="ri-form-group">
                <label className="ri-label" htmlFor="ri-title">Issue Title</label>
                <input
                  id="ri-title"
                  className="ri-input"
                  type="text"
                  placeholder="Brief description of the issue"
                  value={form.title}
                  onChange={(e) => updateField('title', e.target.value)}
                />
              </div>

              <div className="ri-form-group">
                <label className="ri-label" htmlFor="ri-desc">Detailed Description</label>
                <textarea
                  id="ri-desc"
                  className="ri-textarea"
                  placeholder="Provide as much detail as possible about the issue"
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                />
              </div>

              <div className="ri-row">
                <div className="ri-form-group">
                  <label className="ri-label" htmlFor="ri-priority">Priority Level</label>
                  <div className="ri-select-wrap">
                    <select
                      id="ri-priority"
                      className="ri-select"
                      value={form.priority}
                      onChange={(e) => updateField('priority', e.target.value)}
                    >
                      <option value="" disabled>Select Priority</option>
                      {PRIORITIES.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} />
                  </div>
                </div>
                <div className="ri-form-group">
                  <label className="ri-label" htmlFor="ri-category">Issue Category</label>
                  <div className="ri-select-wrap">
                    <select
                      id="ri-category"
                      className="ri-select"
                      value={form.category}
                      onChange={(e) => updateField('category', e.target.value)}
                    >
                      <option value="" disabled>Select Category</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} />
                  </div>
                </div>
              </div>

              {/* Reporter information comes from the signed-in session */}
              <div className="ri-reporter">
                <div className="ri-reporter__title">Reporter Information</div>
                <div className="ri-reporter__row">
                  <div className="ri-reporter__field">Name: <span>{session.name}</span></div>
                  <div className="ri-reporter__field">Role: <span>{session.role || 'Staff'}</span></div>
                </div>
                <div className="ri-reporter__field">Email: <span>{session.email}</span></div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="ri-footer">
              <button type="button" className="ri-submit" id="submitBtn" onClick={handleSubmit} disabled={submitting}>
                <AlertCircle size={16} />
                {submitting ? 'Submitting...' : 'Submit Issue Report'}
              </button>
              <button type="button" className="ri-cancel" onClick={handleCancel}>Cancel</button>
            </div>
          </div>
        </div>
      </div>

      {/* Success toast */}
      <div className={`ri-toast ${showToast ? 'show' : ''}`} id="toast">
        <CheckCircle size={16} /> Issue submitted successfully!
      </div>
    </div>
  );
}
