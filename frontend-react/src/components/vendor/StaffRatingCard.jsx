/**
 * ============================================================================
 * STAFF RATING CARD (StaffRatingCard.jsx)
 * ============================================================================
 * Role: Vendor Portal, shown in Event Review ONLY when the event is completed.
 *
 * Purpose:
 *   The vendor gives each staff member who worked the event 1-5 stars and an
 *   optional comment. A staff member's rating everywhere in the app is the
 *   average of these vendor ratings.
 *   Rules (enforced again by the backend, POST /api/staff/:id/ratings):
 *     - vendors only (any other role gets 403)
 *     - only after the event is completed
 *     - only staff who worked it (declined assignments are left out)
 *     - one rating per vendor per staff member per event. Once rated the row
 *       shows the stars and an "Edit rating" button: a popup prefilled with
 *       the old stars + comment saves the change (PATCH), and the staff
 *       member's average is recalculated by the backend.
 *
 * Props:
 *   @param {Object} event        - the completed event ({ id, name })
 *   @param {Array}  workedStaff  - [{ staffId, staffName, role }] who worked it
 * ============================================================================
 */

import React, { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { editStaffRating, getEventStaffRatings, rateStaff } from "../../services/staffService";
import { StarRow } from "../StaffProfileModal";
import Modal from "../Modal";
import "../../styles/staff-profile.css";

function StaffRatingCard({ event, workedStaff = [] }) {
  // Ratings already saved for this event: { staffId: { stars, comment } }
  const [saved, setSaved] = useState({});

  // What the vendor is typing before saving: { staffId: { stars, comment } }
  const [drafts, setDrafts] = useState({});

  // Staff id currently being saved (disables its button)
  const [savingId, setSavingId] = useState(null);

  // Error message from the backend (e.g. "already rated")
  const [error, setError] = useState("");

  // The rating being edited in the popup: { staffId, staffName, stars, comment } (null = closed)
  const [editing, setEditing] = useState(null);

  // Saves the edited rating (PATCH) and shows the new value in the row
  async function handleSaveEdit() {
    if (!editing?.stars) return;
    setSavingId(editing.staffId);
    setError("");
    try {
      await editStaffRating(editing.staffId, { eventId: event.id, stars: editing.stars, comment: editing.comment || "" });
      setSaved((current) => ({ ...current, [editing.staffId]: { stars: editing.stars, comment: editing.comment || "" } }));
      setEditing(null);
    } catch (err) {
      setError(err.message || "Could not update the rating.");
    } finally {
      setSavingId(null);
    }
  }

  // Loads the ratings already given whenever the event changes
  useEffect(() => {
    let isMounted = true;
    getEventStaffRatings(event.id)
      .then((data) => { if (isMounted) setSaved(data || {}); })
      .catch(() => {});
    return () => { isMounted = false; };
  }, [event.id]);

  // Updates the stars or comment for one person
  function updateDraft(staffId, field, value) {
    setDrafts((current) => ({ ...current, [staffId]: { ...(current[staffId] || {}), [field]: value } }));
  }

  // Sends one rating to the backend and marks the row as rated
  async function handleSave(staffId) {
    const draft = drafts[staffId] || {};
    if (!draft.stars) {
      setError("Pick 1 to 5 stars first.");
      return;
    }
    setSavingId(staffId);
    setError("");
    try {
      await rateStaff(staffId, { eventId: event.id, stars: draft.stars, comment: draft.comment || "" });
      setSaved((current) => ({ ...current, [staffId]: { stars: draft.stars, comment: draft.comment || "" } }));
    } catch (err) {
      setError(err.message || "Could not save the rating.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="client-req-card er-card-section" id="staffRatingSection">
      <div className="er-section-header">
        <h3 className="section-title">
          <Star size={16} className="er-title-icon er-title-icon--blue" /> Rate Staff
        </h3>
      </div>
      <p style={{ margin: "0 0 8px", fontSize: "12.5px", color: "var(--text-muted, #6b5d7e)" }}>
        {event.name} is completed. Rate each person who worked it (1–5 stars). You can edit a rating later.
      </p>
      {error && <div style={{ color: "#f87171", fontSize: "12.5px", marginBottom: "6px" }}>{error}</div>}
      {workedStaff.length === 0 && <div className="sp-muted">No staff worked this event.</div>}

      {workedStaff.map((member) => {
        const done = saved[member.staffId];
        const draft = drafts[member.staffId] || {};
        return (
          <div className="sr-row" key={member.staffId} data-staff-id={member.staffId}>
            <div className="sr-name">
              {member.staffName}
              <div className="sp-muted">{member.role}</div>
            </div>
            {done ? (
              <>
                <StarRow value={done.stars} />
                <span className="sr-done">Rated{done.comment ? `: "${done.comment}"` : ""}</span>
                <button
                  type="button"
                  className="sr-save sr-edit"
                  onClick={() => setEditing({ staffId: member.staffId, staffName: member.staffName, stars: done.stars, comment: done.comment || "" })}
                >
                  Edit rating
                </button>
              </>
            ) : (
              <>
                <span>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      type="button"
                      key={n}
                      className="sr-star-btn"
                      aria-label={`${n} star${n > 1 ? "s" : ""}`}
                      onClick={() => updateDraft(member.staffId, "stars", n)}
                    >
                      <Star size={18} className={n <= (draft.stars || 0) ? "sp-star sp-star--on" : "sp-star"} />
                    </button>
                  ))}
                </span>
                <input
                  className="sr-comment"
                  placeholder="Comment (optional)"
                  maxLength={300}
                  value={draft.comment || ""}
                  onChange={(e) => updateDraft(member.staffId, "comment", e.target.value)}
                />
                <button type="button" className="sr-save" disabled={savingId === member.staffId} onClick={() => handleSave(member.staffId)}>
                  {savingId === member.staffId ? "Saving..." : "Save rating"}
                </button>
              </>
            )}
          </div>
        );
      })}
      {/* Edit popup, prefilled with the old stars + comment */}
      <Modal
        open={Boolean(editing)}
        title={editing ? `Edit rating · ${editing.staffName}` : ""}
        onClose={() => setEditing(null)}
        width={440}
        footer={
          <>
            <button type="button" className="sr-save sr-edit" onClick={() => setEditing(null)}>Cancel</button>
            <button type="button" className="sr-save" disabled={!editing?.stars || savingId === editing?.staffId} onClick={handleSaveEdit}>
              {savingId === editing?.staffId ? "Saving..." : "Save changes"}
            </button>
          </>
        }
      >
        {editing && (
          <div className="sr-edit-body">
            <div>
              {[1, 2, 3, 4, 5].map((n) => (
                <button type="button" key={n} className="sr-star-btn" aria-label={`edit ${n} star${n > 1 ? "s" : ""}`} onClick={() => setEditing({ ...editing, stars: n })}>
                  <Star size={22} className={n <= editing.stars ? "sp-star sp-star--on" : "sp-star"} />
                </button>
              ))}
            </div>
            <input
              className="sr-comment sr-edit-comment"
              placeholder="Comment (optional)"
              maxLength={300}
              value={editing.comment}
              onChange={(e) => setEditing({ ...editing, comment: e.target.value })}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

export default StaffRatingCard;
