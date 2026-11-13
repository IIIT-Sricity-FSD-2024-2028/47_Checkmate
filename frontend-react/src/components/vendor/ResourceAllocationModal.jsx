/**
 * ============================================================================
 * RESOURCE ALLOCATION MODAL (ResourceAllocationModal.jsx)
 * ============================================================================
 * Role: 2-Phase Event Allocation Wizard Dialog (Vendor Portal)
 * Location: src/components/vendor/ResourceAllocationModal.jsx
 *
 * Parent / Invocation Context:
 *   - Called By: src/pages/vendor/ManageResource.jsx
 *   - Parent Page: Vendor Manage Resources (src/pages/vendor/ManageResource.jsx)
 *   - Where in Code: Rendered at the root layout of ManageResource.jsx; displayed
 *     when `isOpen` is true and `allocatingResource` is populated.
 *
 * Purpose:
 *   Guides the vendor through a structured 2-phase allocation workflow:
 *     - Phase 1: Select an approved event from the confirmed event list, displaying
 *       event details (venue, date, attendee count).
 *     - Phase 2: Input allocation quantity, enforcing dynamic availability caps
 *       derived from event date conflict calculations.
 *
 * Props:
 *   @param {boolean} props.isOpen - Whether modal is visible
 *   @param {number} props.allocStep - Current wizard step (1 = Pick Event, 2 = Enter Quantity)
 *   @param {Object|null} props.allocatingResource - The resource targeted for event assignment
 *   @param {number} props.effectiveGlobalStock - Current global unallocated stock for this resource
 *   @param {Array} props.approvedEvents - List of approved/live events available for allocation
 *   @param {string} props.selectedEventId - ID of selected event in Step 1
 *   @param {Object|null} props.selectedEvent - Full event record corresponding to selectedEventId
 *   @param {number} props.availableForSelectedEvent - Calculated free units on the event's date
 *   @param {string|number} props.allocUnits - Quantity value input by the vendor in Step 2
 *   @param {string} props.allocError - Validation error message
 *   @param {Function} props.formatDateReadable - Date formatting utility
 *   @param {Function} props.onSelectEvent - Handler when choosing an event in Step 1
 *   @param {Function} props.onProceedStep2 - Handler transitioning from Step 1 to Step 2
 *   @param {Function} props.onBackStep1 - Handler returning to Step 1 from Step 2
 *   @param {Function} props.onAllocQtyChange - Handler for quantity input change in Step 2
 *   @param {Function} props.onConfirmAllocation - Handler confirming and persisting the allocation
 *   @param {Function} props.onClose - Handler to dismiss the wizard modal
 * ============================================================================
 */

import React from "react";
import {
  X,
  BoxSelect,
  Info,
  ArrowRight,
  ArrowLeft,
  CalendarCheck,
  Check,
} from "lucide-react";

function ResourceAllocationModal({
  isOpen = false,
  allocStep = 1,
  allocatingResource = null,
  effectiveGlobalStock = 0,
  approvedEvents = [],
  selectedEventId = "",
  selectedEvent = null,
  availableForSelectedEvent = 0,
  allocUnits = "",
  allocError = "",
  formatDateReadable = (d) => d || "Date TBD",
  onSelectEvent,
  onProceedStep2,
  onBackStep1,
  onAllocQtyChange,
  onConfirmAllocation,
  onClose,
}) {
  if (!isOpen || !allocatingResource) return null;

  return (
    <div className="vendor-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="vendor-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header with Phase Indicator ── */}
        <div className="vendor-modal__header">
          <h3>
            {allocStep === 1
              ? "Allocate Resource — Step 1 of 2"
              : "Allocate Resource — Step 2 of 2"}
          </h3>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Selected Resource Overview Strip ── */}
        <div className="alloc-res-info">
          <div className="alloc-res-icon">
            <BoxSelect size={18} />
          </div>
          <div>
            <div className="alloc-res-name">{allocatingResource.name}</div>
            <div className="alloc-res-meta">
              {allocatingResource.category} · {effectiveGlobalStock} units in global stock
            </div>
          </div>
        </div>

        {/* ── PHASE 1: EVENT SELECTION ── */}
        {allocStep === 1 && (
          <>
            <div className="alloc-phase-wrap">
              <p className="alloc-step-intro">
                Select the approved event to allocate this inventory resource to:
              </p>

              {approvedEvents.length > 0 ? (
                <div className="form-group">
                  <label className="form-label">Approved Event *</label>
                  <select
                    className={`form-input ${allocError ? "form-input-error" : ""}`}
                    value={selectedEventId}
                    onChange={(e) => onSelectEvent(e.target.value)}
                  >
                    <option value="">Choose an approved event…</option>
                    {approvedEvents.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.name} ({formatDateReadable(ev.date)})
                      </option>
                    ))}
                  </select>
                  {allocError && <span className="form-error-msg">{allocError}</span>}
                </div>
              ) : (
                <div className="alloc-no-events">
                  <Info size={16} />
                  <span>No approved events are currently waiting for equipment allocation.</span>
                </div>
              )}

              {/* Event Details Card (Appears once an event is selected) */}
              {selectedEvent && (
                <div className="alloc-event-info">
                  <div className="alloc-info-row">
                    <span className="alloc-info-label">Venue</span>
                    <span className="alloc-info-value">{selectedEvent.venue || "Venue TBD"}</span>
                  </div>
                  <div className="alloc-info-row">
                    <span className="alloc-info-label">Date</span>
                    <span className="alloc-info-value">{formatDateReadable(selectedEvent.date)}</span>
                  </div>
                  <div className="alloc-info-row">
                    <span className="alloc-info-label">Expected Attendees</span>
                    <span className="alloc-info-people">
                      {selectedEvent.people || selectedEvent.guests || selectedEvent.attendees || "—"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="vendor-modal__footer">
              <button
                type="button"
                className="mr-filter-reset-btn"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="mr-add-btn"
                disabled={!selectedEventId || approvedEvents.length === 0}
                onClick={onProceedStep2}
              >
                <span>Next</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </>
        )}

        {/* ── PHASE 2: QUANTITY INPUT & CONFIRMATION ── */}
        {allocStep === 2 && selectedEvent && (
          <>
            <div className="alloc-phase-wrap">
              {/* Selected Event Pill Badge */}
              <div className="alloc-event-pill">
                <CalendarCheck size={14} />
                <span>{selectedEvent.name}</span>
              </div>

              {/* Attendees & Free Stock Stat Row */}
              <div className="alloc-stat-row">
                <div className="alloc-stat-box">
                  <div className="alloc-stat-label">Event Attendees</div>
                  <div className="alloc-stat-value alloc-stat-value--purple">
                    {selectedEvent.people || selectedEvent.guests || selectedEvent.attendees || "—"}
                  </div>
                </div>
                <div className="alloc-stat-divider" />
                <div className="alloc-stat-box">
                  <div className="alloc-stat-label">Available on {selectedEvent.date}</div>
                  <div className="alloc-stat-value alloc-stat-value--green">
                    {availableForSelectedEvent}
                  </div>
                </div>
              </div>

              {/* Quantity Input */}
              <div className="form-group">
                <label className="form-label">Units to Allocate *</label>
                <input
                  type="number"
                  min="1"
                  max={availableForSelectedEvent}
                  className={`form-input ${allocError ? "form-input-error" : ""}`}
                  placeholder={`Enter quantity (max ${availableForSelectedEvent})`}
                  value={allocUnits}
                  onChange={onAllocQtyChange}
                  autoFocus
                />
                {allocError && <span className="form-error-msg">{allocError}</span>}
                <span className="alloc-qty-hint">
                  Maximum units available for this date: {availableForSelectedEvent} units
                </span>
              </div>
            </div>

            <div className="vendor-modal__footer">
              <button
                type="button"
                className="mr-filter-reset-btn"
                onClick={onBackStep1}
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
              <button
                type="button"
                className="btn-primary-purple"
                disabled={!allocUnits || !!allocError}
                onClick={onConfirmAllocation}
              >
                <Check size={15} />
                <span>Confirm Allocation</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default React.memo(ResourceAllocationModal);
