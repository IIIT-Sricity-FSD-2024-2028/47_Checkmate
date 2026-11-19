/**
 * ============================================================================
 * COMPONENT: VendorRating.jsx — client feedback about vendors
 * ============================================================================
 * After an event is COMPLETED, the client who booked it rates the vendor
 * (1-5 stars + optional comment). One feedback per event; it can be edited.
 * The vendor's rating is the average of all their feedback.
 *
 * Three pieces, all fetching through services/vendorService.js:
 *   <VendorRatingBadge vendorId name />  name + "4.5 ★★★★½ (4 ratings)" or "New"
 *                                        (client package cards, Track page)
 *   <VendorFeedbackPanel event />        client Track page: give / edit feedback
 *   <VendorFeedbackSummary vendorId />   vendor dashboard: average + recent feedback
 *
 * APIs: GET /vendors/feedback-summary, GET /vendors/:id/feedback,
 *       GET|POST|PATCH /events/:id/vendor-feedback
 * ============================================================================
 */

import React, { useEffect, useState } from "react";
import { MessageSquareQuote, Star } from "lucide-react";
import {
  editVendorFeedback,
  getEventVendorFeedback,
  getVendorFeedback,
  getVendorFeedbackSummaries,
  giveVendorFeedback,
} from "../services/vendorService";
import { RatingBadge, StarRow } from "./StaffProfileModal";
import "../styles/staff-profile.css";

// The summaries are the same for every card on a page, so they are fetched
// once and shared (a cached promise), instead of one request per card.
let summariesPromise = null;
function loadSummaries(refresh = false) {
  if (!summariesPromise || refresh) summariesPromise = getVendorFeedbackSummaries().catch(() => ({}));
  return summariesPromise;
}

// RatingBadge expects the staff-profile shape; "New" when there is no feedback
const asProfile = (summary) => (summary ? { rating: summary.rating, ratingCount: summary.ratingCount, isNew: !summary.ratingCount } : null);

/** Vendor name + their average client rating (view only). */
export function VendorRatingBadge({ vendorId, name }) {
  // This vendor's { rating, ratingCount }
  const [summary, setSummary] = useState(null);

  // Loads (or reuses) the shared summaries when the vendor changes
  useEffect(() => {
    let isMounted = true;
    if (!vendorId) return undefined;
    loadSummaries().then((all) => { if (isMounted) setSummary(all?.[vendorId] || null); });
    return () => { isMounted = false; };
  }, [vendorId]);

  if (!vendorId) return null;
  return (
    <span className="vr-badge" data-vendor-id={vendorId}>
      {name && <span className="vr-name">{name}</span>} <RatingBadge profile={asProfile(summary) || { isNew: true }} />
    </span>
  );
}

/** Client Track page: rate the vendor after the event is completed (or edit it). */
export function VendorFeedbackPanel({ event }) {
  // Feedback already saved for this event (null = none yet)
  const [saved, setSaved] = useState(null);

  // What is being typed: { stars, comment }; editing = the form is open
  const [draft, setDraft] = useState({ stars: 0, comment: "" });
  const [editing, setEditing] = useState(false);

  // True while saving; error text from the backend
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isCompleted = String(event?.status).toLowerCase() === "completed";

  // Loads the existing feedback for this event
  useEffect(() => {
    let isMounted = true;
    if (!event?.id || !isCompleted) return undefined;
    getEventVendorFeedback(event.id)
      .then((f) => {
        if (!isMounted) return;
        setSaved(f || null);
        setEditing(!f);
        setDraft({ stars: f?.stars || 0, comment: f?.comment || "" });
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, [event?.id, isCompleted]);

  // Saves new feedback (POST) or the edited one (PATCH)
  async function handleSave() {
    if (!draft.stars) {
      setError("Pick 1 to 5 stars.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const result = saved
        ? await editVendorFeedback(event.id, draft)
        : await giveVendorFeedback(event.id, draft);
      setSaved(result);
      setEditing(false);
      loadSummaries(true); // averages changed
    } catch (err) {
      setError(err.message || "Could not save your feedback.");
    } finally {
      setSaving(false);
    }
  }

  if (!isCompleted || !event.vendorId) return null;

  return (
    <div className="card vr-panel" id="vendorFeedbackPanel">
      <h3 className="cl-section-title"><Star size={18} color="var(--pink)" /> Rate your vendor</h3>
      <p className="sp-muted">How was {event.vendor || "your vendor"} for {event.name}? Your rating is shown to other clients.</p>

      {saved && !editing ? (
        <div className="vr-saved">
          <StarRow value={saved.stars} size={18} />
          {saved.comment && <div className="vr-comment">"{saved.comment}"</div>}
          <button type="button" className="sr-save sr-edit" onClick={() => setEditing(true)}>Edit feedback</button>
        </div>
      ) : (
        <div className="vr-form">
          <div>
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} className="sr-star-btn" aria-label={`vendor ${n} star${n > 1 ? "s" : ""}`} onClick={() => setDraft({ ...draft, stars: n })}>
                <Star size={22} className={n <= draft.stars ? "sp-star sp-star--on" : "sp-star"} />
              </button>
            ))}
          </div>
          <textarea
            className="reason-details vr-text"
            rows="2"
            maxLength={500}
            placeholder="Tell others about your experience (optional)"
            value={draft.comment}
            onChange={(e) => setDraft({ ...draft, comment: e.target.value })}
          />
          <button type="button" className="sr-save" disabled={saving} onClick={handleSave}>
            {saving ? "Saving..." : saved ? "Save changes" : "Submit feedback"}
          </button>
        </div>
      )}
      {error && <div className="sp-error">{error}</div>}
    </div>
  );
}

/** Vendor dashboard: their average client rating and the latest feedback. */
export function VendorFeedbackSummary({ vendorId }) {
  // { rating, ratingCount, recent[] }
  const [summary, setSummary] = useState(null);

  // Loads this vendor's summary
  useEffect(() => {
    let isMounted = true;
    if (!vendorId) return undefined;
    getVendorFeedback(vendorId).then((s) => { if (isMounted) setSummary(s); }).catch(() => {});
    return () => { isMounted = false; };
  }, [vendorId]);

  if (!vendorId) return null;
  return (
    <div className="card vr-summary" id="vendorFeedbackSummary">
      <div className="card-header">
        <h3 className="card-title"><MessageSquareQuote size={16} /> Client Feedback</h3>
        <RatingBadge profile={asProfile(summary) || { isNew: true }} />
      </div>
      {!summary?.recent?.length && <div className="sp-muted">No client feedback yet.</div>}
      {summary?.recent?.map((f, i) => (
        <div className="sp-review" key={i}>
          <StarRow value={f.stars} size={12} /> <span className="sp-muted">{f.by} · {f.eventName}</span>
          {f.comment && <div className="sp-review__text">"{f.comment}"</div>}
        </div>
      ))}
    </div>
  );
}
