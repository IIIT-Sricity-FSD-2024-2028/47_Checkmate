/* ============================================================
   PAGE: Staff Report Issue (ReportIssue.jsx)
   PURPOSE: Provides a controlled form for staff to submit operational,
            technical, logistical, or vendor problems directly to
            event managers and organizers.
   API ENDPOINTS USED:
     - GET /api/events   : Fetches available events to populate event dropdown
     - POST /api/issues  : Submits the completed issue report payload
============================================================ */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/staff.css';
import Toast from './components/Toast';
import { getSessionUser, fetchEvents, createIssue } from '../../services/staffApi';

export default function StaffReportIssue() {
  // Hook for programmatic navigation (e.g., navigating back on Cancel)
  const navigate = useNavigate();

  // Reads currently authenticated staff user details (name, email, role) from localStorage
  // FACULTY MAY ASK: How do you auto-fill reporter information if session is missing?
  // HOW TO CHANGE: Provide fallback defaults in session object: `session.name || 'Anonymous Staff'`.
  const [session] = useState(() => getSessionUser());

  // Form field states: Controlled inputs for issue details
  // Stores the concise headline of the issue
  // FACULTY MAY ASK: How do you set a default placeholder or initial title?
  // HOW TO CHANGE: Change useState('') to useState('Default Title') or edit input placeholder.
  const [title, setTitle] = useState('');

  // Stores full multi-line explanation of the issue and reproduction steps
  // FACULTY MAY ASK: How do you enforce a minimum length of 20 characters for description?
  // HOW TO CHANGE: In handleSubmit validation, check `if (desc.trim().length < 20) { setError('Description must be at least 20 chars'); return; }`.
  const [desc, setDesc] = useState('');

  // Stores urgency level selected from dropdown ('Low', 'Medium', 'High', 'Critical')
  // FACULTY MAY ASK: How do you make "Medium" the default priority instead of empty?
  // HOW TO CHANGE: Initialize `const [priority, setPriority] = useState('Medium');`.
  const [priority, setPriority] = useState('');

  // Stores problem classification ('Technical', 'Logistics', 'Staff', 'Vendor', 'Other')
  // FACULTY MAY ASK: How do you add a new category like "Catering" or "Security"?
  // HOW TO CHANGE: Add `<option value="Security">Security</option>` inside the category select element in JSX.
  const [category, setCategory] = useState('');

  // Stores the ID of the event associated with this issue (optional)
  // FACULTY MAY ASK: How do you make selecting an event mandatory?
  // HOW TO CHANGE: In handleSubmit validation, add `if (!selectedEventId) { setError('Please select an event.'); return; }`.
  const [selectedEventId, setSelectedEventId] = useState('');

  // Stores list of active events fetched from backend for the event selector dropdown
  // FACULTY MAY ASK: Where does the events list come from?
  // HOW TO CHANGE: Fetched by loadEvents() from fetchEvents() (`GET /api/events`).
  const [events, setEvents] = useState([]);

  // Flag indicating if form is currently submitting (disables button to prevent duplicate submissions)
  // FACULTY MAY ASK: How do you prevent double submission when clicking fast?
  // HOW TO CHANGE: Controlled by `submitting` boolean which sets `disabled={submitting}` on submit button.
  const [submitting, setSubmitting] = useState(false);

  // Stores toast alert notification text and style type ({ text, type })
  // FACULTY MAY ASK: How do you change how long the success toast stays on screen?
  // HOW TO CHANGE: Change 4000 in `setTimeout(() => setToastMessage(null), 4000)` to 2000 for 2 seconds.
  const [toastMessage, setToastMessage] = useState(null);

  // Stores validation or network error message to display in the alert banner
  // FACULTY MAY ASK: How do you automatically clear the error banner when the user types?
  // HOW TO CHANGE: Call `setError(null)` in the input `onChange` handlers alongside setState.
  const [error, setError] = useState(null);

  // Load available events on component mount to populate the dropdown
  // FACULTY MAY ASK: What happens if the events API fails or server is offline?
  // HOW TO CHANGE: The catch block supplies fallback mock events so the dropdown remains usable.
  useEffect(() => {
    async function loadEvents() {
      try {
        const eventList = await fetchEvents();
        if (Array.isArray(eventList)) {
          setEvents(eventList);
        }
      } catch {
        // Fallback sample events if backend is offline
        setEvents([
          { id: 'EVT001', name: 'Johnson Wedding – Apr 15, 2026' },
          { id: 'EVT002', name: 'Summer Music Festival' },
          { id: 'EVT003', name: 'Corporate Gala 2026' },
        ]);
      }
    }

    loadEvents();
  }, []);

  // Form submit handler: validates inputs, constructs issue payload, and calls POST API
  // FACULTY MAY ASK: How do you redirect to the Dashboard or TaskBoard after submitting?
  // HOW TO CHANGE: In handleSubmit after createIssue, add `setTimeout(() => navigate('/staff/dashboard'), 1500);`.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Client-side field validations
    if (!title.trim()) {
      setError('Please enter an issue title.');
      return;
    }
    if (!desc.trim()) {
      setError('Please provide a detailed description.');
      return;
    }
    if (!priority) {
      setError('Please select a priority level.');
      return;
    }
    if (!category) {
      setError('Please select an issue category.');
      return;
    }

    // Issue object payload to be stored in the database
    // FACULTY MAY ASK: How do you set the initial status of the issue to "pending" instead of "open"?
    // HOW TO CHANGE: Change `status: 'open'` to `status: 'pending'` in newIssue object.
    const newIssue = {
      title: title.trim(),
      desc: desc.trim(),
      priority,
      category,
      event: selectedEventId || null,
      eventId: selectedEventId || null,
      reporter: session.name,
      reporterRole: session.role || 'Staff',
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    setSubmitting(true);
    try {
      await createIssue(newIssue);

      // Display floating success toast notification
      setToastMessage({
        text: 'Issue submitted successfully! Our team will review it.',
        type: 'success',
      });

      // Reset form fields back to empty state
      // FACULTY MAY ASK: How do you prevent resetting the form after submission?
      // HOW TO CHANGE: Comment out or remove the setTitle(''), setDesc(''), etc. calls.
      setTitle('');
      setDesc('');
      setPriority('');
      setCategory('');
      setSelectedEventId('');

      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      setError(`Failed to submit issue: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="staff-page-container">
      {/* Floating Toast Notification on Success */}
      {toastMessage && <Toast message={toastMessage.text} type={toastMessage.type} />}

      <div className="ri-wrap">
        <div className="ri-card">
          {/* Header: Title, subtitle and warning icon */}
          {/* FACULTY MAY ASK: How do you change the card header icon or title? */}
          {/* HOW TO CHANGE: Edit text in .ri-header-title or replace the SVG in .ri-header-icon. */}
          <div className="ri-header">
            <div className="ri-header-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <circle cx="12" cy="16" r="1" fill="currentColor" />
              </svg>
            </div>
            <div>
              <div className="ri-header-title">Report an Issue</div>
              <div className="ri-header-sub">Help us resolve issues quickly by providing detailed information</div>
            </div>
          </div>

          {/* Validation or API Error Banner */}
          {/* FACULTY MAY ASK: How do you style the error banner with a close button? */}
          {/* HOW TO CHANGE: Add a button inside this div with `onClick={() => setError(null)}`. */}
          {error && (
            <div style={{ padding: '12px 16px', background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: 'var(--rs)', marginBottom: '16px', fontSize: '13px', color: '#fff' }}>
              {error}
            </div>
          )}

          {/* Form: Controlled form handling inputs and submit */}
          <form onSubmit={handleSubmit}>
            {/* Issue Title Input */}
            {/* FACULTY MAY ASK: How do you set a maximum length of 100 characters on title? */}
            {/* HOW TO CHANGE: Add `maxLength={100}` attribute to the input element. */}
            <div className="form-group">
              <label className="form-label">
                Issue Title <span className="req">*</span>
              </label>
              <input
                className="form-input"
                type="text"
                placeholder="Brief description of the issue"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Detailed Description Textarea */}
            {/* FACULTY MAY ASK: How do you change the number of visible lines in the textarea? */}
            {/* HOW TO CHANGE: Add `rows={6}` attribute to the textarea element. */}
            <div className="form-group">
              <label className="form-label">
                Detailed Description <span className="req">*</span>
              </label>
              <textarea
                className="form-textarea"
                placeholder="Provide as much detail as possible about the issue..."
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
              <div className="form-hint">Include what happened, when it occurred, and any steps to reproduce the issue</div>
            </div>

            {/* Priority & Category Dropdowns Row */}
            <div className="form-row form-group">
              {/* Priority Select */}
              {/* FACULTY MAY ASK: How do you add a new priority level like "Urgent"? */}
              {/* HOW TO CHANGE: Add `<option value="Urgent">Urgent</option>` inside this select element. */}
              <div>
                <label className="form-label">
                  Priority Level <span className="req">*</span>
                </label>
                <select
                  className="form-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="" disabled>Select priority</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              {/* Issue Category Select */}
              {/* FACULTY MAY ASK: How do you rename category "Technical" to "IT / Audio-Visual"? */}
              {/* HOW TO CHANGE: Change `<option value="Technical">Technical</option>` to `<option value="IT / Audio-Visual">IT / Audio-Visual</option>`. */}
              <div>
                <label className="form-label">
                  Issue Category <span className="req">*</span>
                </label>
                <select
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="" disabled>Select category</option>
                  <option value="Technical">Technical</option>
                  <option value="Logistics">Logistics</option>
                  <option value="Staff">Staff</option>
                  <option value="Vendor">Vendor</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Related Event Optional Select */}
            {/* FACULTY MAY ASK: How do you sort events alphabetically in this dropdown? */}
            {/* HOW TO CHANGE: Call `.slice().sort((a,b) => (a.name||'').localeCompare(b.name||''))` before `.map()`. */}
            <div className="form-group">
              <label className="form-label">Related Event (Optional)</label>
              <select
                className="form-select"
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
              >
                <option value="">Select event if applicable</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name || ev.title || ev.eventName || ev.id}
                  </option>
                ))}
              </select>
            </div>

            {/* What Happens Next Guidance Box */}
            {/* FACULTY MAY ASK: How do you add an estimated response time SLA line here? */}
            {/* HOW TO CHANGE: Add another `<div className="ri-info-item">...</div>` inside `.ri-info-list`. */}
            <div className="ri-info">
              <div className="ri-info-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <circle cx="12" cy="16" r="1" fill="currentColor" />
                </svg>
                What happens next?
              </div>
              <div className="ri-info-list">
                <div className="ri-info-item">Your issue will be reviewed by our team within 24 hours</div>
                <div className="ri-info-item">You'll receive updates on the issue status</div>
                <div className="ri-info-item">Critical issues are addressed immediately</div>
              </div>
            </div>

            {/* Reporter Information (Read-Only) */}
            {/* FACULTY MAY ASK: Why is reporter info read-only instead of editable inputs? */}
            {/* HOW TO CHANGE: It is pulled securely from authenticated session to guarantee accountability. */}
            <div className="ri-reporter">
              <div className="ri-reporter-title">Reporter Information</div>
              <div className="ri-reporter-grid">
                <div className="ri-reporter-item">Name: <span>{session.name}</span></div>
                <div className="ri-reporter-item">Role: <span>{session.role}</span></div>
                <div className="ri-reporter-item">Email: <span>{session.email}</span></div>
              </div>
            </div>

            {/* Submit & Cancel Action Buttons */}
            {/* FACULTY MAY ASK: How do you disable the submit button until required fields are filled? */}
            {/* HOW TO CHANGE: Set `disabled={submitting || !title.trim() || !desc.trim() || !priority || !category}`. */}
            <div className="ri-submit">
              <button type="submit" className="ri-submit-btn" disabled={submitting}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <circle cx="12" cy="16" r="1" fill="currentColor" />
                </svg>
                {submitting ? 'Submitting...' : 'Submit Issue Report'}
              </button>
              <button
                type="button"
                className="ri-cancel-btn"
                onClick={() => navigate(-1)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   VIVA QUICK NOTES - ReportIssue.jsx
   ============================================================
   1. DATA FLOW:
      - Mount: loadEvents() calls fetchEvents() to populate the optional "Related Event" dropdown.
      - User Input: Controlled components update React state variables (title, desc, priority, category, selectedEventId).
      - Submission: handleSubmit(e) validates non-empty fields, bundles reporter info from session,
        and executes createIssue(newIssue) via POST to /api/issues.
      - Feedback: On success, displays a Toast notification, resets form inputs, and keeps user informed.
      - Cancel: Uses React Router's navigate(-1) to return to the previous page.

   2. TOP 5 FACULTY QUESTIONS & EXACT CODE TO EDIT:
      Q1: "How do you make the Related Event dropdown required?"
          -> In handleSubmit (around line 75), add:
             `if (!selectedEventId) { setError('Please select an event.'); return; }`.
      Q2: "How do you add a new category option (e.g. 'Security')?"
          -> In the Category <select> JSX (around line 220), add:
             `<option value="Security">Security</option>`.
      Q3: "How do you redirect to the TaskBoard after successful submission?"
          -> In handleSubmit inside try block (around line 115), add:
             `setTimeout(() => navigate('/staff/tasks'), 1500);`.
      Q4: "How do you set 'Medium' as default priority?"
          -> In the priority useState declaration (around line 25), change
             `useState('')` to `useState('Medium')`.
      Q5: "How do you disable the submit button until required fields are filled?"
          -> On the submit button (around line 280), set:
             `disabled={submitting || !title.trim() || !desc.trim() || !priority || !category}`.
============================================================ */