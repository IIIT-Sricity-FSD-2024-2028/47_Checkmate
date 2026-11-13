/**
 * Lets a client change an event request before the vendor approves it.
 * The name and type stay fixed, because they identify the request.
 */

import React, { useState } from "react";
import Modal from "../Modal";
import VenuePicker from "./VenuePicker";
import { parseTimeToMinutes } from "../../services/eventService";
import { formatTime12 } from "../../utils/clientHelpers";

// "6:30 PM" -> "18:30", the format a time input needs
function toInputTime(time) {
  const minutes = parseTimeToMinutes(time);
  if (minutes === null) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

function EditEventForm({ event, onClose, onSave }) {
  const [form, setForm] = useState({
    date: event.date || "",
    time: toInputTime(event.time),
    endTime: toInputTime(event.endTime),
    venue: event.venue === "TBD" ? "" : event.venue || "",
    people: event.people || event.guests || "",
    notes: event.notes || "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.date || !form.time || !form.endTime || !(Number(form.people) > 0)) {
      setError("Date, start time, end time and guests are required.");
      return;
    }
    if (form.endTime <= form.time) {
      setError("End time must be after the start time.");
      return;
    }

    setSaving(true);
    const saved = await onSave(event.id, {
      date: form.date,
      time: formatTime12(form.time),
      endTime: formatTime12(form.endTime),
      venue: form.venue.trim() || "TBD",
      people: Number(form.people),
      guests: Number(form.people),
      notes: form.notes.trim(),
    });
    setSaving(false);
    if (saved) onClose();
    else setError("Could not save your changes. Please try again.");
  };

  return (
    <Modal
      open
      title={`Edit ${event.name}`}
      onClose={onClose}
      width={520}
      footer={
        <>
          <button type="button" className="cl-btn-ghost" onClick={onClose}>Close</button>
          <button type="button" className="cl-btn-pink" disabled={saving} onClick={handleSave}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </>
      }
    >
      <div className="cl-form-grid">
        <div className="cl-field cl-full">
          <label>Event Date *</label>
          <input className="cl-input" type="date" min={new Date().toLocaleDateString("en-CA")} value={form.date} onChange={(e) => update("date", e.target.value)} />
        </div>
        <div className="cl-field">
          <label>Start Time *</label>
          <input className="cl-input" type="time" value={form.time} onChange={(e) => update("time", e.target.value)} />
        </div>
        <div className="cl-field">
          <label>End Time *</label>
          <input className="cl-input" type="time" value={form.endTime} onChange={(e) => update("endTime", e.target.value)} />
        </div>
        <div className="cl-field">
          <label>Guests *</label>
          <input className="cl-input" type="number" min="1" value={form.people} onChange={(e) => update("people", e.target.value)} />
        </div>
        <div className="cl-field">
          <label>Venue</label>
          <VenuePicker value={form.venue} onChange={(value) => update("venue", value)} />
        </div>
        <div className="cl-field cl-full">
          <label>Notes</label>
          <textarea className="cl-input" rows="3" value={form.notes} onChange={(e) => update("notes", e.target.value)} />
        </div>
      </div>
      {error && <div className="cl-error">{error}</div>}
    </Modal>
  );
}

function EditEventModal({ event, onClose, onSave }) {
  if (!event) return null;
  return <EditEventForm key={event.id} event={event} onClose={onClose} onSave={onSave} />;
}

export default EditEventModal;
