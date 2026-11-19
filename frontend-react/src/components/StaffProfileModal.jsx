/**
 * ============================================================================
 * COMPONENT: StaffProfileModal.jsx (shared: client Create Event + vendor pages)
 * ============================================================================
 * WHAT IT DOES:
 *   Opens when a staff card is clicked and shows that person's public profile:
 *   avatar, name, role, experience, skills, events completed, and rating.
 *     - Rating = average of the stars vendors gave after completed events.
 *     - Nobody completed yet -> a "New" badge and NO rating (rule from the owner).
 *     - busyOn (optional) -> "Unavailable: working on <event> that day".
 *   An optional action button (e.g. "Add as preference") is shown in the footer.
 *
 * PROPS:
 *   staffId      - which profile to load (null = closed)
 *   onClose      - close the modal
 *   busyOn       - { eventName } when the person is busy on the chosen date
 *   actionLabel  - text of the footer action button (omit = no button)
 *   onAction     - called with the profile when the action button is clicked
 *   actionDisabled - greys out the action button
 *
 * API USED (services/staffService.js):
 *   - GET /api/staff-profiles/:id
 * ============================================================================
 */

import { useEffect, useState } from "react";
import { Award, Briefcase, CalendarCheck, Star, StarHalf, X } from "lucide-react";
import { getStaffProfileById } from "../services/staffService";
import "../styles/staff-profile.css";

// Avatar colours (staff rows store one of these names in `avatar`)
const AVATAR_GRADIENTS = {
  pink: "linear-gradient(135deg, #e91e8c, #a855f7)",
  teal: "linear-gradient(135deg, #06b6d4, #3b82f6)",
  purple: "linear-gradient(135deg, #8b5cf6, #ec4899)",
  green: "linear-gradient(135deg, #22c55e, #16a34a)",
  orange: "linear-gradient(135deg, #f97316, #ef4444)",
};

// Five star icons for a value like 4.5: full stars, then a half star when the
// value is at least .5 over a whole number, then empty stars
export function StarRow({ value = 0, size = 14 }) {
  const v = Number(value) || 0;
  return (
    <span className="sp-stars" aria-label={`${v} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) =>
        v >= n ? (
          <Star key={n} size={size} className="sp-star sp-star--on" />
        ) : v >= n - 0.5 ? (
          <span key={n} className="sp-star-half">
            <Star size={size} className="sp-star" />
            <StarHalf size={size} className="sp-star sp-star--on" />
          </span>
        ) : (
          <Star key={n} size={size} className="sp-star" />
        )
      )}
    </span>
  );
}

// True when there is nothing to average yet: no completed events or no ratings.
// Such staff show a "New" badge and NO stars (owner's rule).
export function isNewStaff(profile) {
  return !profile || profile.isNew || !profile.ratingCount || profile.rating === null || profile.rating === undefined;
}

// Badge used on every staff card: "New", or "4.5 ★★★★½ (12 ratings)". View only.
export function RatingBadge({ profile }) {
  if (!profile) return null;
  if (isNewStaff(profile)) return <span className="sp-badge sp-badge--new">New</span>;
  return (
    <span className="sp-badge sp-badge--rating" title={`Average of ${profile.ratingCount} vendor rating${profile.ratingCount === 1 ? "" : "s"}`}>
      <strong>{profile.rating.toFixed(1)}</strong> <StarRow value={profile.rating} size={11} />{" "}
      <span className="sp-badge__count">({profile.ratingCount} rating{profile.ratingCount === 1 ? "" : "s"})</span>
    </span>
  );
}

function StaffProfileModal({ staffId, onClose, busyOn = null, actionLabel = "", onAction, actionDisabled = false }) {
  // The loaded profile (null while loading)
  const [profile, setProfile] = useState(null);

  // Message shown if the profile cannot be loaded
  const [error, setError] = useState("");

  // Loads the profile each time a different staff member is opened
  useEffect(() => {
    let isMounted = true;
    setProfile(null);
    setError("");
    if (!staffId) return undefined;
    getStaffProfileById(staffId)
      .then((data) => { if (isMounted) setProfile(data); })
      .catch(() => { if (isMounted) setError("Could not load this profile. Please try again."); });
    return () => { isMounted = false; };
  }, [staffId]);

  // Close on the Escape key
  useEffect(() => {
    if (!staffId) return undefined;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [staffId, onClose]);

  if (!staffId) return null;

  return (
    <div className="sp-overlay" onClick={onClose}>
      <div className="sp-card" role="dialog" aria-modal="true" aria-label="Staff profile" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="sp-close" onClick={onClose} aria-label="Close"><X size={18} /></button>

        {error && <div className="sp-error">{error}</div>}
        {!profile && !error && <div className="sp-muted">Loading profile...</div>}

        {profile && (
          <>
            {/* Avatar, name, role, rating */}
            <div className="sp-head">
              <div className="sp-avatar" style={{ background: AVATAR_GRADIENTS[profile.avatar] || AVATAR_GRADIENTS.pink }}>
                {profile.initials || profile.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
              </div>
              <div>
                <h3 className="sp-name">{profile.name}</h3>
                <div className="sp-role">{profile.role}{profile.vendor ? ` · ${profile.vendor}` : ""}</div>
                <div className="sp-rating-line">
                  {isNewStaff(profile) ? (
                    <span className="sp-badge sp-badge--new">New</span>
                  ) : (
                    <>
                      <strong>{profile.rating.toFixed(1)}</strong>
                      <StarRow value={profile.rating} />
                      <span className="sp-muted">({profile.ratingCount} rating{profile.ratingCount === 1 ? "" : "s"})</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {busyOn && (
              <div className="sp-busy">Unavailable on this date: already working on {busyOn.eventName}.</div>
            )}

            {/* Three quick facts */}
            <div className="sp-facts">
              <div className="sp-fact"><Briefcase size={16} /><strong>{profile.experienceYears}</strong><span>yrs experience</span></div>
              <div className="sp-fact"><CalendarCheck size={16} /><strong>{profile.eventsCompleted}</strong><span>events completed</span></div>
              <div className="sp-fact"><Award size={16} /><strong>{isNewStaff(profile) ? "New" : profile.rating.toFixed(1)}</strong><span>rating</span></div>
            </div>

            {profile.bio && <p className="sp-bio">{profile.bio}</p>}

            {/* Skills as chips */}
            <div className="sp-section-title">Skills</div>
            <div className="sp-chips">
              {profile.skills.length === 0 && <span className="sp-muted">No skills listed.</span>}
              {profile.skills.map((skill) => <span key={skill} className="sp-chip">{skill}</span>)}
            </div>

            {/* Latest vendor reviews (never shown for New staff) */}
            {profile.reviews.length > 0 && (
              <>
                <div className="sp-section-title">Recent vendor reviews</div>
                {profile.reviews.map((r, i) => (
                  <div key={i} className="sp-review">
                    <StarRow value={r.stars} size={12} /> <span className="sp-muted">by {r.by}</span>
                    {r.comment && <div className="sp-review__text">"{r.comment}"</div>}
                  </div>
                ))}
              </>
            )}

            {actionLabel && (
              <button type="button" className="sp-action" disabled={actionDisabled} onClick={() => onAction(profile)}>
                {actionLabel}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default StaffProfileModal;
