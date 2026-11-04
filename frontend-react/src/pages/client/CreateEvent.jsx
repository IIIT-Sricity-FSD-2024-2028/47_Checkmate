/**
 * ============================================================================
 * MULTI-STEP CREATE EVENT WIZARD (CreateEvent.jsx)
 * ============================================================================
 * Role: Client Portal
 * Location: src/pages/client/CreateEvent.jsx
 *
 * Purpose:
 *   Comprehensive 4-step interactive wizard matching legacy create_event_client.js:
 *     - Step 1: Event Details & Specifications (Name, Type, Date, Time, Venue, Guests, Budget, Notes)
 *     - Step 2: Resource & Equipment Allocation (Live resources from API with quantity counters & search)
 *     - Step 3: Operational Staff Requisition (Live staff profiles from API with role selection)
 *     - Step 4: Review, Cost Estimate, and Submission to /api/events
 * ============================================================================
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
  FileText,
  Boxes,
  UserCheck,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Plus,
  Minus,
  Search,
  Sparkles,
  AlertTriangle,
  Building2,
} from 'lucide-react';

import '../../styles/client.css';
import { getAuthSession, getAuthUser } from '../../services/auth/authStorage';
import { createEvent } from '../../services/eventService';
import { getResources } from '../../services/resourceService';
import { getStaff } from '../../services/staffService';

export default function ClientCreateEvent() {
  const navigate = useNavigate();
  const session = getAuthSession();
  const user = getAuthUser() || session?.user || {};

  // Wizard Step (1, 2, 3, 4)
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Step 1: Details
  const [eventName, setEventName] = useState('');
  const [eventType, setEventType] = useState('Conference');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('09:00');
  const [venue, setVenue] = useState('');
  const [people, setPeople] = useState(100);
  const [budgetType, setBudgetType] = useState('$5,000 - $10,000');
  const [customBudget, setCustomBudget] = useState('');
  const [notes, setNotes] = useState('');
  const [step1Errors, setStep1Errors] = useState({});

  // Step 2: Resources
  const [availableResources, setAvailableResources] = useState([]);
  const [selectedResources, setSelectedResources] = useState({}); // { [id]: { resource, qty } }
  const [resSearch, setResSearch] = useState('');
  const [resCategory, setResCategory] = useState('all');

  // Step 3: Staff
  const [availableStaff, setAvailableStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState({}); // { [id]: staffMember }
  const [staffSearch, setStaffSearch] = useState('');

  // Status & Feedback
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [createdEventId, setCreatedEventId] = useState(null);

  // Load Resources and Staff from backend on mount
  useEffect(() => {
    let mounted = true;

    async function loadCatalog() {
      try {
        const [rsc, stf] = await Promise.all([
          getResources().catch(() => []),
          getStaff().catch(() => []),
        ]);

        if (mounted) {
          setAvailableResources(Array.isArray(rsc) ? rsc : []);
          setAvailableStaff(Array.isArray(stf) ? stf : []);
        }
      } catch (err) {
        console.error('Failed to load resources/staff catalog:', err);
      } finally {
        if (mounted) setLoadingInitial(false);
      }
    }

    loadCatalog();
    return () => {
      mounted = false;
    };
  }, []);

  // Filtered resources
  const filteredResources = useMemo(() => {
    return availableResources.filter((r) => {
      const matchCat =
        resCategory === 'all' ||
        String(r.category || '').toLowerCase() === resCategory.toLowerCase();
      const matchSearch =
        !resSearch ||
        String(r.name || '').toLowerCase().includes(resSearch.toLowerCase()) ||
        String(r.category || '').toLowerCase().includes(resSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [availableResources, resCategory, resSearch]);

  // Filtered staff
  const filteredStaff = useMemo(() => {
    return availableStaff.filter((s) => {
      if (!staffSearch) return true;
      const q = staffSearch.toLowerCase();
      return (
        String(s.name || '').toLowerCase().includes(q) ||
        String(s.role || '').toLowerCase().includes(q) ||
        String(s.vendor || '').toLowerCase().includes(q)
      );
    });
  }, [availableStaff, staffSearch]);

  // Resource Quantity Handlers
  const handleResourceQtyChange = (rsc, delta) => {
    setSelectedResources((prev) => {
      const current = prev[rsc.id] ? prev[rsc.id].qty : 0;
      const newQty = Math.max(0, current + delta);
      if (newQty === 0) {
        const copy = { ...prev };
        delete copy[rsc.id];
        return copy;
      }
      return {
        ...prev,
        [rsc.id]: {
          resourceId: rsc.id,
          resourceName: rsc.name,
          category: rsc.category || 'Equipment',
          qty: newQty,
          pricePerDay: rsc.pricePerDay || rsc.cost || 50,
          vendor: rsc.vendor || 'Elite Events Co.',
          vendorId: rsc.vendorId || 'V001',
        },
      };
    });
  };

  // Staff Selection Toggle
  const handleToggleStaff = (member) => {
    setSelectedStaff((prev) => {
      if (prev[member.id]) {
        const copy = { ...prev };
        delete copy[member.id];
        return copy;
      }
      return {
        ...prev,
        [member.id]: {
          staffId: member.id,
          staffName: member.name,
          role: member.role || 'Staff',
          vendor: member.vendor || 'Elite Events Co.',
          vendorId: member.vendorId || 'V001',
        },
      };
    });
  };

  // Cost Calculation
  const estimatedCost = useMemo(() => {
    let cost = 0;
    Object.values(selectedResources).forEach((r) => {
      cost += (r.qty || 1) * (r.pricePerDay || 50);
    });
    // Add base guest overhead
    cost += Math.max(500, (parseInt(people, 10) || 50) * 15);
    return cost;
  }, [selectedResources, people]);

  // Step 1 Validation
  const validateStep1 = () => {
    const errors = {};
    if (!eventName.trim()) errors.eventName = 'Event name is required.';
    if (!eventDate) errors.eventDate = 'Event date is required.';
    if (!venue.trim()) errors.venue = 'Venue location is required.';
    if (!people || parseInt(people, 10) < 1) errors.people = 'Enter expected guest count.';

    setStep1Errors(errors);
    return Object.keys(errors).length === 0;
  };

  // Navigation between steps
  const handleNext = () => {
    if (currentStep === 1) {
      if (!validateStep1()) return;
    }
    setCurrentStep((prev) => Math.min(totalSteps, prev + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Final Event Submission to Backend
  const handleSubmitFinal = async () => {
    try {
      setSubmitting(true);

      const reqResources = Object.values(selectedResources).map((r) => ({
        resourceId: r.resourceId,
        resourceName: r.resourceName,
        category: r.category,
        quantity: r.qty,
        pricePerDay: r.pricePerDay,
        vendor: r.vendor,
        vendorId: r.vendorId,
      }));

      const reqStaff = Object.values(selectedStaff).map((s) => ({
        staffId: s.staffId,
        staffName: s.staffName,
        role: s.role,
        vendor: s.vendor,
        vendorId: s.vendorId,
      }));

      const targetVendor = 'Elite Events Co.';
      const targetVendorId = 'V001';

      const finalBudget =
        budgetType === 'custom' && customBudget
          ? parseInt(customBudget.replace(/[^0-9]/g, ''), 10) || 5000
          : 7500;

      const payload = {
        name: eventName.trim(),
        type: eventType,
        date: eventDate,
        time: eventTime,
        venue: venue.trim(),
        people: parseInt(people, 10) || 1,
        guests: parseInt(people, 10) || 1,
        status: 'pending',
        notes: notes.trim() || undefined,
        createdBy: 'client',
        client: user.name || session?.name || 'Emily Carter',
        clientId: user.id || session?.userId || 'U004',
        clientEmail: user.email || session?.email || 'emily.client@example.com',
        vendor: targetVendor,
        vendorId: targetVendorId,
        vendors: [targetVendor],
        vendorIds: [targetVendorId],
        categories: [eventType, ...new Set(reqResources.map((r) => r.category))].filter(Boolean),
        budget: finalBudget,
        budgetRange: budgetType === 'custom' ? `$${customBudget}` : budgetType,
        requestedResources: reqResources.length > 0 ? reqResources : undefined,
        requestedStaff: reqStaff.length > 0 ? reqStaff : undefined,
        estimatedCost: estimatedCost,
        submittedAt: new Date().toISOString(),
      };

      const result = await createEvent(payload);
      setCreatedEventId(result?.id || 'EVT-NEW');
      setSubmissionSuccess(true);
    } catch (err) {
      alert(`Failed to create event: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (submissionSuccess) {
    return (
      <div className="client-content-wrap" style={{ maxWidth: '680px', margin: '40px auto' }}>
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '48px 32px',
            border: '1px solid rgba(34,197,94,0.3)',
            background: 'linear-gradient(180deg, rgba(34,197,94,0.06), var(--bg-card))',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(34,197,94,0.15)',
              color: '#22c55e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <CheckCircle2 size={36} />
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Event Proposal Submitted!
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
            Your event request for <strong style={{ color: 'var(--text-primary)' }}>"{eventName}"</strong> has been
            dispatched to our vendor coordinators for feasibility review and scheduling.
          </p>

          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '10px',
              padding: '16px',
              marginBottom: '28px',
              textAlign: 'left',
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              fontSize: '13px',
            }}
          >
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Event ID:</span>{' '}
              <strong style={{ color: 'var(--pink)' }}>{createdEventId}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Date:</span>{' '}
              <strong>{eventDate}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Location:</span>{' '}
              <strong>{venue}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Estimated Cost:</span>{' '}
              <strong style={{ color: '#22c55e' }}>${estimatedCost.toLocaleString()}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/client/events')}
            >
              View My Events
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate(`/client/track/${createdEventId}`)}
            >
              Track Event Progress →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="client-content-wrap">
      {/* Top Title */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Create New Event
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
          Follow our 4-step wizard to customize your event logistics, equipment, and staff.
        </p>
      </div>

      {/* Wizard Step Indicator Bar */}
      <div className="wizard-stepper mb-6">
        <div className={`step-node ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
          <div className="step-circle">{currentStep > 1 ? '✓' : '1'}</div>
          <span className="step-label">Details</span>
        </div>
        <div className={`step-line ${currentStep > 1 ? 'done' : ''}`} />

        <div className={`step-node ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
          <div className="step-circle">{currentStep > 2 ? '✓' : '2'}</div>
          <span className="step-label">Resources</span>
        </div>
        <div className={`step-line ${currentStep > 2 ? 'done' : ''}`} />

        <div className={`step-node ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
          <div className="step-circle">{currentStep > 3 ? '✓' : '3'}</div>
          <span className="step-label">Staffing</span>
        </div>
        <div className={`step-line ${currentStep > 3 ? 'done' : ''}`} />

        <div className={`step-node ${currentStep === 4 ? 'active' : ''}`}>
          <div className="step-circle">4</div>
          <span className="step-label">Review</span>
        </div>
      </div>

      {/* Wizard Step 1: Details */}
      {currentStep === 1 && (
        <div className="card" style={{ maxWidth: '820px', margin: '0 auto' }}>
          <div className="card__header">
            <h3>Step 1: Event Specifics</h3>
          </div>

          <div className="form-grid mb-4">
            <div className="form-group full">
              <label>Event Name *</label>
              <input
                type="text"
                className={`form-control ${step1Errors.eventName ? 'input-error' : ''}`}
                placeholder="e.g. Annual Executive Tech Summit 2026"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
              />
              {step1Errors.eventName && (
                <span className="error-msg" style={{ color: '#ef4444', fontSize: '11px' }}>
                  {step1Errors.eventName}
                </span>
              )}
            </div>

            <div className="form-group">
              <label>Event Type *</label>
              <select
                className="form-control"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
              >
                <option value="Conference">Conference / Seminar</option>
                <option value="Wedding">Wedding Celebration</option>
                <option value="Corporate">Corporate Gala / Dinner</option>
                <option value="Birthday">Birthday / Anniversary</option>
                <option value="Concert">Music & Entertainment</option>
                <option value="Networking">Networking / Meetup</option>
              </select>
            </div>

            <div className="form-group">
              <label>Expected Guests *</label>
              <input
                type="number"
                min="1"
                className={`form-control ${step1Errors.people ? 'input-error' : ''}`}
                value={people}
                onChange={(e) => setPeople(e.target.value)}
              />
              {step1Errors.people && (
                <span className="error-msg" style={{ color: '#ef4444', fontSize: '11px' }}>
                  {step1Errors.people}
                </span>
              )}
            </div>

            <div className="form-group">
              <label>Date *</label>
              <input
                type="date"
                className={`form-control ${step1Errors.eventDate ? 'input-error' : ''}`}
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
              {step1Errors.eventDate && (
                <span className="error-msg" style={{ color: '#ef4444', fontSize: '11px' }}>
                  {step1Errors.eventDate}
                </span>
              )}
            </div>

            <div className="form-group">
              <label>Time</label>
              <input
                type="time"
                className="form-control"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
              />
            </div>

            <div className="form-group full">
              <label>Venue / Location *</label>
              <input
                type="text"
                className={`form-control ${step1Errors.venue ? 'input-error' : ''}`}
                placeholder="e.g. Grand Metropolitan Ballroom, Downtown"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
              />
              {step1Errors.venue && (
                <span className="error-msg" style={{ color: '#ef4444', fontSize: '11px' }}>
                  {step1Errors.venue}
                </span>
              )}
            </div>

            <div className="form-group full">
              <label>Budget Range</label>
              <select
                className="form-control"
                value={budgetType}
                onChange={(e) => setBudgetType(e.target.value)}
              >
                <option value="$2,000 - $5,000">$2,000 - $5,000</option>
                <option value="$5,000 - $10,000">$5,000 - $10,000</option>
                <option value="$10,000 - $25,000">$10,000 - $25,000</option>
                <option value="$25,000+">$25,000+</option>
                <option value="custom">Custom Amount</option>
              </select>
            </div>

            {budgetType === 'custom' && (
              <div className="form-group full">
                <label>Custom Budget Amount ($)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 15000"
                  value={customBudget}
                  onChange={(e) => setCustomBudget(e.target.value)}
                />
              </div>
            )}

            <div className="form-group full">
              <label>Special Notes & Requirements (Optional)</label>
              <textarea
                rows={3}
                className="form-control"
                placeholder="Include any specific theme preferences, dietary restrictions, or schedule constraints..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button type="button" className="btn btn-primary" onClick={handleNext}>
              Continue to Resources <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Wizard Step 2: Resources Selection */}
      {currentStep === 2 && (
        <div className="card" style={{ maxWidth: '920px', margin: '0 auto' }}>
          <div className="card__header" style={{ alignItems: 'flex-start' }}>
            <div>
              <h3>Step 2: Reserve Resources & Equipment</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                Select audiovisual equipment, staging, lighting, and furniture for your event.
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Selected Items:</span>{' '}
              <strong style={{ color: 'var(--pink)' }}>
                {Object.values(selectedResources).reduce((acc, curr) => acc + curr.qty, 0)}
              </strong>
            </div>
          </div>

          {/* Filter Bar */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div className="search-box" style={{ flex: 1, minWidth: '220px' }}>
              <Search size={14} className="search-icon" />
              <input
                type="text"
                placeholder="Search equipment or supplies..."
                value={resSearch}
                onChange={(e) => setResSearch(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {['all', 'audio', 'visual', 'staging', 'furniture', 'lighting'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`btn ${resCategory === cat ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ padding: '6px 12px', fontSize: '12px', textTransform: 'capitalize' }}
                  onClick={() => setResCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Resources Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '16px',
              maxHeight: '420px',
              overflowY: 'auto',
              paddingRight: '4px',
            }}
          >
            {filteredResources.map((r) => {
              const selectedQty = selectedResources[r.id]?.qty || 0;
              return (
                <div
                  key={r.id}
                  style={{
                    background: selectedQty > 0 ? 'rgba(233,30,140,0.08)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${selectedQty > 0 ? 'var(--pink)' : 'var(--border)'}`,
                    borderRadius: '10px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          color: 'var(--cyan)',
                        }}
                      >
                        {r.category || 'Equipment'}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#22c55e' }}>
                        ${r.pricePerDay || r.cost || 50}/day
                      </span>
                    </div>

                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                      {r.name}
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                      {r.description || r.vendor || 'Available in stock'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Quantity:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ padding: '4px 8px', borderRadius: '4px' }}
                        onClick={() => handleResourceQtyChange(r, -1)}
                        disabled={selectedQty === 0}
                      >
                        <Minus size={12} />
                      </button>
                      <span style={{ fontSize: '13px', fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>
                        {selectedQty}
                      </span>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ padding: '4px 8px', borderRadius: '4px' }}
                        onClick={() => handleResourceQtyChange(r, 1)}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
            <button type="button" className="btn btn-secondary" onClick={handlePrev}>
              <ChevronLeft size={16} /> Back
            </button>
            <button type="button" className="btn btn-primary" onClick={handleNext}>
              Continue to Staffing <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Wizard Step 3: Staffing Selection */}
      {currentStep === 3 && (
        <div className="card" style={{ maxWidth: '920px', margin: '0 auto' }}>
          <div className="card__header" style={{ alignItems: 'flex-start' }}>
            <div>
              <h3>Step 3: Event Staffing & Coordinators</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                Select specialized personnel and coordinators to manage on-site execution.
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Staff Selected:</span>{' '}
              <strong style={{ color: 'var(--pink)' }}>{Object.keys(selectedStaff).length}</strong>
            </div>
          </div>

          {/* Search */}
          <div style={{ marginBottom: '18px' }}>
            <div className="search-box">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                placeholder="Search staff members by name or role..."
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Staff Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '16px',
              maxHeight: '420px',
              overflowY: 'auto',
              paddingRight: '4px',
            }}
          >
            {filteredStaff.map((s) => {
              const isSelected = !!selectedStaff[s.id];
              return (
                <div
                  key={s.id}
                  onClick={() => handleToggleStaff(s)}
                  style={{
                    background: isSelected ? 'rgba(233,30,140,0.1)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isSelected ? 'var(--pink)' : 'var(--border)'}`,
                    borderRadius: '10px',
                    padding: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--purple), var(--pink))',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {(s.name || 'S')
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                      {s.name}
                    </h4>
                    <div style={{ fontSize: '12px', color: 'var(--cyan)', marginTop: '2px' }}>
                      {s.role || 'Staff Member'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {s.vendor || 'Elite Events Co.'}
                    </div>
                  </div>

                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: `2px solid ${isSelected ? 'var(--pink)' : 'var(--border)'}`,
                      background: isSelected ? 'var(--pink)' : 'transparent',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                    }}
                  >
                    {isSelected && '✓'}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
            <button type="button" className="btn btn-secondary" onClick={handlePrev}>
              <ChevronLeft size={16} /> Back
            </button>
            <button type="button" className="btn btn-primary" onClick={handleNext}>
              Review Proposal <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Wizard Step 4: Review & Confirmation */}
      {currentStep === 4 && (
        <div className="card" style={{ maxWidth: '820px', margin: '0 auto' }}>
          <div className="card__header">
            <h3>Step 4: Final Review & Feasibility Confirmation</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Summary Highlights */}
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '20px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Event Name
                </div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {eventName}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Event Type
                </div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--pink)', marginTop: '4px' }}>
                  {eventType}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Date & Time
                </div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {eventDate} at {eventTime}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Venue Location
                </div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {venue}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Guest Count
                </div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {people} Attendees
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Budget / Estimated
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#22c55e', marginTop: '4px' }}>
                  ${estimatedCost.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Selected Resources Breakdown */}
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '18px',
              }}
            >
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 12px' }}>
                Allocated Resources ({Object.keys(selectedResources).length} Items)
              </h4>
              {Object.keys(selectedResources).length === 0 ? (
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Standard venue setup (No additional equipment selected)
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {Object.values(selectedResources).map((r) => (
                    <span
                      key={r.resourceId}
                      style={{
                        background: 'rgba(233,30,140,0.1)',
                        border: '1px solid rgba(233,30,140,0.3)',
                        color: 'var(--text-primary)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}
                    >
                      {r.qty}x {r.resourceName} (${r.pricePerDay * r.qty})
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Staff Breakdown */}
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '18px',
              }}
            >
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 12px' }}>
                Assigned Team Members ({Object.keys(selectedStaff).length} Personnel)
              </h4>
              {Object.keys(selectedStaff).length === 0 ? (
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Vendor default assignment (Coordinator will auto-assign suitable staff)
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {Object.values(selectedStaff).map((s) => (
                    <span
                      key={s.staffId}
                      style={{
                        background: 'rgba(6,182,212,0.1)',
                        border: '1px solid rgba(6,182,212,0.3)',
                        color: 'var(--text-primary)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}
                    >
                      {s.staffName} ({s.role})
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handlePrev}
              disabled={submitting}
            >
              <ChevronLeft size={16} /> Back
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmitFinal}
              disabled={submitting}
              style={{
                background: 'linear-gradient(135deg, var(--pink), #db2777)',
                padding: '10px 24px',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              {submitting ? 'Submitting to Coordinators...' : 'Submit Event Request 🚀'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
